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
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E5D5FD] border-t-[#9360E3] mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Loading scholarships...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-xl border border-red-200 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchSchemes}
            className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-white to-[#E5D5FD]/30 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Available Scholarships
              </h1>
              <p className="text-purple-100 text-lg">
                Browse and apply for scholarship programs
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-5xl">🎓</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center space-x-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-sm text-purple-100">Total Schemes</p>
              <p className="text-2xl font-bold">{schemes.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-sm text-purple-100">Active Programs</p>
              <p className="text-2xl font-bold">{schemes.filter(s => s.availableSlots > 0).length}</p>
            </div>
          </div>
        </div>

        {/* Scholarships Grid */}
        {schemes.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm p-12 rounded-2xl shadow-xl border border-[#E5D5FD] text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#9360E3]/20 to-[#7a4dc4]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">📚</span>
            </div>
            <p className="text-gray-700 text-xl font-semibold mb-2">
              No active scholarship schemes available
            </p>
            <p className="text-gray-500">
              Please check back later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-[#E5D5FD] p-6 hover:shadow-xl hover:border-[#9360E3] transition-all duration-300"
              >
                {/* Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {scheme.schemeName}
                  </h2>
                  {scheme.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {scheme.description}
                    </p>
                  )}
                </div>

                {/* Amount Badge */}
                <div className="bg-gradient-to-r from-[#9360E3]/10 to-[#7a4dc4]/10 border border-[#9360E3]/20 rounded-xl p-4 mb-4">
                  <p className="text-xs text-gray-600 mb-1">Scholarship Amount</p>
                  <p className="text-2xl font-bold text-[#9360E3]">
                    Ξ {scheme.scholarshipAmount}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Available Slots</p>
                    <p className={`text-lg font-bold ${scheme.availableSlots > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {scheme.availableSlots}/{scheme.totalSlots}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Registered</p>
                    <p className="text-lg font-bold text-gray-700">
                      {scheme.registeredStudents || 0}
                    </p>
                  </div>
                </div>

                {/* Eligibility */}
                {scheme.eligibilityCriteria && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-bold text-blue-900 mb-1 flex items-center">
                      <span className="mr-1">✓</span> Eligibility
                    </p>
                    <p className="text-xs text-blue-700 line-clamp-2">
                      {scheme.eligibilityCriteria}
                    </p>
                  </div>
                )}

                {/* Duration */}
                {scheme.startDate && scheme.endDate && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-bold text-purple-900 mb-1 flex items-center">
                      <span className="mr-1">📅</span> Duration
                    </p>
                    <p className="text-xs text-purple-700">
                      {new Date(scheme.startDate).toLocaleDateString()} - {new Date(scheme.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Required Documents */}
                {scheme.requiredDocuments && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-bold text-orange-900 mb-1 flex items-center">
                      <span className="mr-1">📎</span> Required Documents
                    </p>
                    <p className="text-xs text-orange-700 line-clamp-2">
                      {scheme.requiredDocuments}
                    </p>
                  </div>
                )}

                {/* Register Button */}
                <button
                  onClick={() => handleRegisterForScheme(scheme)}
                  disabled={registering === scheme.id || scheme.availableSlots <= 0}
                  className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${
                    scheme.availableSlots <= 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : registering === scheme.id
                      ? 'bg-[#9360E3] text-white cursor-wait opacity-75'
                      : 'bg-gradient-to-r from-[#9360E3] to-[#7a4dc4] text-white hover:shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  {registering === scheme.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registering...
                    </span>
                  ) : scheme.availableSlots <= 0 ? (
                    '❌ No Slots Available'
                  ) : (
                    '✓ Register & Apply'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-gradient-to-r from-[#9360E3]/10 to-[#7a4dc4]/10 border border-[#9360E3]/20 rounded-2xl p-6">
          <p className="text-[#9360E3] font-semibold flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <span className="text-sm pt-1">
              <strong>How it works:</strong> Click "Register & Apply" to reserve your slot and proceed to the application form. Complete your application with all required documents to be considered for the scholarship.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipListing;