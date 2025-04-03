import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, getFirestore } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import './ChecklistInvitation.css';

interface ChecklistInvitation {
  id: string;
  checklistId: string;
  checklistTitle: string;
  ownerId: string;
  ownerName: string;
  status: 'pending' | 'accepted' | 'rejected';
}

const ChecklistInvitation: React.FC = () => {
  const [invitations, setInvitations] = useState<ChecklistInvitation[]>([]);
  const { currentUser } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    if (currentUser) {
      fetchInvitations();
    }
  }, [currentUser]);

  const fetchInvitations = async () => {
    if (!currentUser) return;

    const invitationsRef = collection(db, 'checklistInvitations');
    const q = query(invitationsRef, 
      where('userId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    const fetchedInvitations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChecklistInvitation[];
    
    setInvitations(fetchedInvitations);
  };

  const handleInvitationResponse = async (invitationId: string, accepted: boolean) => {
    const invitationRef = doc(db, 'checklistInvitations', invitationId);
    const invitation = invitations.find(i => i.id === invitationId);
    if (!invitation) return;

    const checklistRef = doc(db, 'checklists', invitation.checklistId);
    
    await updateDoc(invitationRef, {
      status: accepted ? 'accepted' : 'rejected'
    });

    if (accepted) {
      const checklistDoc = await getDoc(checklistRef);
      const checklistData = checklistDoc.data();
      const sharedWith = checklistData?.sharedWith || [];
      await updateDoc(checklistRef, {
        sharedWith: [...sharedWith, currentUser?.uid]
      });
    }

    fetchInvitations();
  };

  if (invitations.length === 0) return null;

  return (
    <div className="invitations-container">
      <h3>Checklist Invitations</h3>
      {invitations.map(invitation => (
        <div key={invitation.id} className="invitation-item">
          <p>
            {invitation.ownerName} invited you to join "{invitation.checklistTitle}"
          </p>
          <div className="invitation-actions">
            <button 
              onClick={() => handleInvitationResponse(invitation.id, true)}
              className="accept-button"
            >
              Accept
            </button>
            <button 
              onClick={() => handleInvitationResponse(invitation.id, false)}
              className="reject-button"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChecklistInvitation; 