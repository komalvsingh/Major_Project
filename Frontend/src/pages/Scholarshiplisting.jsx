import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc, increment, addDoc, query, where } from 'firebase/firestore';

const ScholarshipListing = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(null);

  useEffect(() => {
    // Mock current user - replace with your actual auth context
    setCurrentUser({ uid: 'user123', email: 'student@example.com' });
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const db = getFirestore();
      const schemesCollection = collection(db, 'scholarshipSchemes');
      const schemesSnapshot = await getDocs(schemesCollection);
      
      const schemesData = schemesSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      const activeSchemes = schemesData.filter(scheme => scheme.isActive);
      
      setSchemes(activeSchemes);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching schemes:', err);
      setError('Failed to load scholarship schemes');
      setLoading(false);
    }
  };

  const checkIfAlreadyRegistered = async (schemeId) => {
    if (!currentUser) return false;
    
    try {
      const db = getFirestore();
      const registrationsRef = collection(db, 'schemeRegistrations');
      const q = query(
        registrationsRef,
        where('studentId', '==', currentUser.uid),
        where('schemeId', '==', schemeId)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (err) {
      console.error('Error checking registration:', err);
      return false;
    }
  };

  const handleRegisterForScheme = async (scheme) => {
    if (!currentUser) {
      alert('Please login to register for scholarships');
      return;
    }

    if (scheme.availableSlots <= 0) {
      alert('Sorry, no slots available for this scholarship');
      return;
    }

    const alreadyRegistered = await checkIfAlreadyRegistered(scheme.id);
    if (alreadyRegistered) {
      alert('You have already registered for this scholarship');
      return;
    }

    setRegistering(scheme.id);

    try {
      const db = getFirestore();
      
      await addDoc(collection(db, 'schemeRegistrations'), {
        studentId: currentUser.uid,
        studentEmail: currentUser.email,
        schemeId: scheme.id,
        schemeName: scheme.schemeName,
        registeredAt: new Date().toISOString(),
        applicationStatus: 'pending'
      });

      const schemeRef = doc(db, 'scholarshipSchemes', scheme.id);
      await updateDoc(schemeRef, {
        registeredStudents: increment(1),
        availableSlots: increment(-1)
      });

      alert('Successfully registered! Redirecting to application page...');
      
      // Redirect to application page with scheme ID
      window.location.href = `/apply?schemeId=${scheme.id}`;
      
    } catch (err) {
      console.error('Error registering for scheme:', err);
      alert('Failed to register for scholarship. Please try again.');
    } finally {
      setRegistering(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scholarships...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchSchemes}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Available Scholarships
          </h1>
          <p className="text-gray-600">
            Browse and apply for scholarship programs
          </p>
        </div>

        {schemes.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 text-lg">
              No active scholarship schemes available at the moment.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Please check back later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-3">
                  {scheme.schemeName}
                </h2>

                {scheme.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {scheme.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-lg font-semibold text-green-600">
                      {scheme.scholarshipAmount} ETH
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Available Slots:</span>
                    <span className={`font-semibold ${scheme.availableSlots > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {scheme.availableSlots} / {scheme.totalSlots}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Registered:</span>
                    <span className="font-semibold text-gray-700">
                      {scheme.registeredStudents || 0} students
                    </span>
                  </div>
                </div>

                {scheme.eligibilityCriteria && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Eligibility:
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {scheme.eligibilityCriteria}
                    </p>
                  </div>
                )}

                {scheme.startDate && scheme.endDate && (
                  <div className="mb-4 text-xs text-gray-500">
                    <p>Duration: {new Date(scheme.startDate).toLocaleDateString()} - {new Date(scheme.endDate).toLocaleDateString()}</p>
                  </div>
                )}

                {scheme.requiredDocuments && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Required Documents:
                    </p>
                    <p className="text-xs text-gray-600">
                      {scheme.requiredDocuments}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleRegisterForScheme(scheme)}
                  disabled={registering === scheme.id || scheme.availableSlots <= 0}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    scheme.availableSlots <= 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : registering === scheme.id
                      ? 'bg-blue-400 text-white cursor-wait'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {registering === scheme.id
                    ? 'Registering...'
                    : scheme.availableSlots <= 0
                    ? 'No Slots Available'
                    : 'Register & Apply'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScholarshipListing;