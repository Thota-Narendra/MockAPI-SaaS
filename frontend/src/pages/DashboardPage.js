import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { useAuthContext } from '../context/AuthContext';
import api from '../api';
import '../App.css'; // We'll use the auth styles for the form

const DashboardPage = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();

  // --- State ---
  const [userEmail, setUserEmail] = useState(null);
  const [orgs, setOrgs] = useState([]); // To store the list of organizations
  const [newOrgName, setNewOrgName] = useState(''); // For the "create" form
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Handlers ---
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- Data Fetching ---
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch both user and org data at the same time
      const [userResponse, orgsResponse] = await Promise.all([
        api.get('/users/me'),
        api.get('/organizations')
      ]);

      setUserEmail(userResponse.data.email);
      setOrgs(orgsResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setError('Failed to load data.');
      setLoading(false);
      // If token is bad, log out
      if (error.response && error.response.status === 401) {
        handleLogout();
      }
    }
  };

  // --- Run on Page Load ---
  useEffect(() => {
    fetchDashboardData();
  }, []); // The empty array [] means "run only once"

  // --- Create Organization Handler ---
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName) return; // Don't submit if empty

    try {
      // Call the API to create the new org
      await api.post('/organizations', { name: newOrgName });

      // Clear the form and refresh the org list
      setNewOrgName('');
      fetchDashboardData(); // Re-fetch to show the new org
    } catch (error) {
      console.error('Failed to create organization', error);
      setError('Failed to create organization.');
    }
  };

  // --- Render Logic ---
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <div>
          {userEmail && <span style={{ marginRight: '1rem' }}>Welcome, <strong>{userEmail}</strong>!</span>}
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>
            Logout
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <hr style={{ margin: '2rem 0' }} />

      {/* Section to Create New Organization */}
      <div className="auth-container" style={{ margin: '0 0 2rem 0', padding: '1.5rem' }}>
        <h3>Create New Organization</h3>
        <form className="auth-form" onSubmit={handleCreateOrg}>
          <div>
            <label>Organization Name</label>
            <input
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="My Awesome Team"
              required
            />
          </div>
          <button type="submit">Create</button>
        </form>
      </div>

      {/* Section to List Existing Organizations */}
      <div>
        <h3>Your Organizations</h3>
        {orgs.length === 0 ? (
          <p>You are not a member of any organizations yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {orgs.map(org => (
              <li key={org.id} style={{ background: 'white', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                {/* This is the new clickable link */}
                <Link to={`/org/${org.id}`} style={{ textDecoration: 'none', color: 'black' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{org.name}</span>
                  <p>{org.projects.length} Projects • {org.members.length} Members</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;