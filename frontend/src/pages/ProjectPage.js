import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuthContext } from '../context/AuthContext';
import RequestLog from '../components/RequestLog'; // <-- CRITICAL IMPORT
import '../App.css';

const ProjectPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuthContext();

  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('');
  const [statusCode, setStatusCode] = useState(200);
  const [body, setBody] = useState('{}');

  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    try {
      const orgsResponse = await api.get('/organizations');
      let foundProject = null;
      for (const org of orgsResponse.data) {
        const proj = org.projects.find(p => p.id === parseInt(projectId));
        if (proj) {
          foundProject = proj;
          break;
        }
      }

      if (foundProject) {
        setProject(foundProject);
      } else {
        setError('Project not found or you do not have access.');
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch project", err);
      setError('Failed to load project.');
      setLoading(false);
      if (err.response && err.response.status === 401) {
        logout();
      }
    }
  }, [projectId, logout]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleCreateEndpoint = async (e) => {
    e.preventDefault();
    setError(null);

    let cleanPath = path.trim();
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1);
    }

    try {
      await api.post(`/projects/${projectId}/endpoints`, {
        method: method,
        path: cleanPath,
        description: "A new mock endpoint",
        response: {
          status_code: parseInt(statusCode),
          body: body,
          delay_ms: 0,
          failure_rate: 0
        }
      });

      setPath('');
      setBody('{}');
      setStatusCode(200);
      fetchProjectData();
    } catch (err) {
      console.error("Failed to create endpoint", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to create endpoint.');
      }
    }
  };

  if (loading) {
    return <div>Loading project...</div>;
  }
  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }
  if (!project) {
    return <div>Project not found.</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: 'auto', textAlign: 'left' }}>
      <Link to={`/org/${project.organization_id}`}>← Back to Organization</Link>
      <h2 style={{ marginTop: '1rem' }}>{project.name}</h2>
      <p>Mock URL Base: <code>http://localhost:8001/mock/{project.url_slug}</code></p>

      {error && <p style={{ color: 'red', background: '#ffeeee', padding: '1rem', borderRadius: '8px' }}>{error}</p>}

      <hr style={{ margin: '2rem 0' }} />

      {/* --- Create Endpoint Form --- */}
      <div className="auth-container" style={{ margin: '0 0 2rem 0', padding: '1.5rem' }}>
        <h3>Create New Endpoint</h3>
        <form className="auth-form" onSubmit={handleCreateEndpoint}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: '1' }}>
              <label>Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div style={{ flex: '3' }}>
              <label>Path (e.g., /users/1)</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/users"
                required
              />
            </div>
            <div style={{ flex: '1' }}>
              <label>Status</label>
              <input
                type="number"
                value={statusCode}
                onChange={(e) => setStatusCode(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label>Response Body (JSON as a string)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'monospace' }}
            />
          </div>
          <button type="submit">Create Endpoint</button>
        </form>
      </div>

      {/* --- LIVE LOGS INTEGRATION --- */}
      {project && <RequestLog projectSlug={project.url_slug} />}
      <hr style={{ margin: '2rem 0' }} />
      {/* --- END LOGS INTEGRATION --- */}


      <h3>Endpoints</h3>
      {project.endpoints.length === 0 ? (
        <p>This project has no endpoints yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {project.endpoints.map(endpoint => (
            <li key={endpoint.id} style={{ background: 'white', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontFamily: 'monospace' }}>
              <span style={{ fontWeight: 'bold', background: '#eee', padding: '0.25rem 0.5rem', borderRadius: '4px', marginRight: '1rem' }}>
                {endpoint.method}
              </span>
              <span>{endpoint.path}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectPage;