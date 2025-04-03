import React, { useState, useEffect } from 'react';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, getFirestore } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Todo } from '../../components/Todo/types';
import ChecklistInvitation from './ChecklistInvitation';
import './Checklist.css';

interface Checklist {
  id: string;
  title: string;
  ownerId: string;
  sharedWith: string[];
  todos: Todo[];
  createdAt: Date;
}

interface User {
  uid: string;
  displayName: string;
  email: string;
}

const Checklist: React.FC = () => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedChecklist, setSelectedChecklist] = useState<string>('');
  const { currentUser } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    if (currentUser) {
      fetchChecklists();
      fetchUsers();
    }
  }, [currentUser]);

  const fetchChecklists = async () => {
    if (!currentUser) return;

    const checklistsRef = collection(db, 'checklists');
    const q = query(checklistsRef, 
      where('ownerId', '==', currentUser.uid),
      where('sharedWith', 'array-contains', currentUser.uid)
    );
    
    const querySnapshot = await getDocs(q);
    const fetchedChecklists = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Checklist[];
    
    setChecklists(fetchedChecklists);
  };

  const fetchUsers = async () => {
    if (!currentUser) return;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '!=', currentUser.uid));
    const querySnapshot = await getDocs(q);
    const fetchedUsers = querySnapshot.docs.map(doc => ({
      ...doc.data()
    })) as User[];
    
    setUsers(fetchedUsers);
  };

  const createChecklist = async () => {
    if (!currentUser || !newChecklistTitle.trim()) return;

    const checklistData = {
      title: newChecklistTitle.trim(),
      ownerId: currentUser.uid,
      sharedWith: [currentUser.uid],
      todos: [],
      createdAt: new Date()
    };

    await addDoc(collection(db, 'checklists'), checklistData);
    setNewChecklistTitle('');
    fetchChecklists();
  };

  const shareChecklist = async () => {
    if (!selectedUser || !selectedChecklist) return;

    const checklistRef = doc(db, 'checklists', selectedChecklist);
    const checklist = checklists.find(c => c.id === selectedChecklist);
    
    if (checklist && !checklist.sharedWith.includes(selectedUser)) {
      // Create an invitation
      await addDoc(collection(db, 'checklistInvitations'), {
        checklistId: selectedChecklist,
        checklistTitle: checklist.title,
        userId: selectedUser,
        ownerId: currentUser?.uid,
        ownerName: currentUser?.displayName || 'Unknown User',
        status: 'pending',
        createdAt: new Date()
      });

      setSelectedUser('');
      setSelectedChecklist('');
    }
  };

  return (
    <div className="checklist-container">
      <ChecklistInvitation />
      
      <h2>Checklists</h2>
      
      <div className="new-checklist">
        <input
          type="text"
          value={newChecklistTitle}
          onChange={(e) => setNewChecklistTitle(e.target.value)}
          placeholder="New checklist title"
        />
        <button onClick={createChecklist}>Create Checklist</button>
      </div>

      <div className="share-checklist">
        <select 
          value={selectedChecklist} 
          onChange={(e) => setSelectedChecklist(e.target.value)}
        >
          <option value="">Select Checklist</option>
          {checklists.map(checklist => (
            <option key={checklist.id} value={checklist.id}>
              {checklist.title}
            </option>
          ))}
        </select>

        <select 
          value={selectedUser} 
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select User</option>
          {users.map(user => (
            <option key={user.uid} value={user.uid}>
              {user.displayName || user.email}
            </option>
          ))}
        </select>

        <button 
          onClick={shareChecklist}
          disabled={!selectedUser || !selectedChecklist}
        >
          Share
        </button>
      </div>

      <div className="checklists-list">
        {checklists.map(checklist => (
          <div key={checklist.id} className="checklist-item">
            <h3>{checklist.title}</h3>
            <div className="checklist-actions">
              <button onClick={() => {
                setSelectedChecklist(checklist.id);
              }}>
                Share
              </button>
            </div>
            {/* Todo list will be implemented here */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Checklist; 