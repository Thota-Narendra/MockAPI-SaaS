import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import Link
import api from '../api';
import { useAuthContext } from '../context/AuthContext';
import '../App.css'; // Use the same styles

const OrganizationPage = () => {
  const { orgId } = useParams(); // Get the org ID from the URL
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuthContext();

  // --- State for the new project form ---
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectSlug, setNewProjectSlug] = useState('');

  // --- Data Fetching ---
  const fetchOrgData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all orgs and find the one we need
      const response = await api.get('/organizations');
      const currentOrg = response.data.find(o => o.id === parseInt(orgId));

      if (currentOrg) {
        setOrg(currentOrg);
      } else {
        setError('Organization not found or you are not a member.');
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch org", err);
      setError('Failed to load organization.');
      setLoading(false);
      if (err.response && err.response.status === 401) {
        logout();
      }
    }
  }, [orgId, logout]);

  useEffect(() => {
    fetchOrgData();
  }, [fetchOrgData]);

  // --- Create Project Handler ---
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Call the API to create the new project
      await api.post(`/organizations/${orgId}/projects`, {
        name: newProjectName,
        url_slug: newProjectSlug
      });

      // Clear the form and refresh the org data
      setNewProjectName('');
      setNewProjectSlug('');
      fetchOrgData(); // Re-fetch data to show the new project
    } catch (err) {
      console.error("Failed to create project", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail); // Show RBAC errors!
      } else {
        setError('Failed to create project.');
      }
    }
  };


  if (loading) {
    return <div>Loading organization...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!org) {
    return <div>Organization not found.</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto', textAlign: 'left' }}>
      <Link to="/dashboard">← Back to Dashboard</Link>
      <h2 style={{ marginTop: '1rem' }}>{org.name}</h2>

      {error && <p style={{ color: 'red', background: '#ffeeee', padding: '1rem', borderRadius: '8px' }}>{error}</p>}

      <hr style={{ margin: '2rem 0' }} />

      {/* --- Create Project Form --- */}
      <div className="auth-container" style={{ margin: '0 0 2rem 0', padding: '1.5rem' }}>
        <h3>Create New Project</h3>
        <form className="auth-form" onSubmit={handleCreateProject}>
          <div>
            <label>Project Name</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="My Web App v3"
              required
            />
          </div>
          <div>
            <label>Mock URL Slug (Unique)</label>
            <input
              type="text"
              value={newProjectSlug}
              onChange={(e) => setNewProjectSlug(e.target.value)}
              placeholder="my-web-app-v3"
              required
            />
          </div>
          <button type="submit">Create Project</button>
        </form>
      </div>

      <h3>Projects</h3>
      {org.projects.length === 0 ? (
        <p>This organization has no projects yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {org.projects.map(project => (
            // This is the new clickable link
            <li key={project.id} style={{ background: 'white', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <Link to={`/project/${project.id}`} style={{ textDecoration: 'none', color: 'black' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{project.name}</span>
                <p>Mock URL: <code>http://localhost:8001/mock/{project.url_slug}/...</code></p>
                <span>Manage Endpoints →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <hr style={{ margin: '2rem 0' }} />

      <h3>Members</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {org.members.map(member => (
          <li key={member.user.id} style={{ background: 'white', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold' }}>{member.user.email}</span>
            <span style={{ float: 'right', background: '#eee', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{member.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrganizationPage;