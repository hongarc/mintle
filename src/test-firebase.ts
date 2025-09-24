// Simple Firebase connection test
import { db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to read a non-existent document (should not fail)
    const testDoc = doc(db, 'test', 'connection');
    const docSnap = await getDoc(testDoc);
    
    console.log('✅ Firebase connection successful!');
    console.log('Document exists:', docSnap.exists());
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
}

// Run the test
testFirebaseConnection();