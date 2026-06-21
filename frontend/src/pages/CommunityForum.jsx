import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../components/Icons';
import './CommunityForum.css';

export default function CommunityForum({ onBack }) {
  const { authFetch, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', content: '', tags: '' });
  
  const [activePost, setActivePost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/forum/posts');
      if (res.ok) setPosts(await res.json());
    } catch (e) {
      setError('Failed to load forum posts');
    }
    setLoading(false);
  };

  const loadComments = async (postId) => {
    try {
      const res = await authFetch(`/api/forum/posts/${postId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch (e) {}
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = postForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      await authFetch('/api/forum/posts', {
        method: 'POST',
        body: JSON.stringify({ ...postForm, tags: tagsArray }),
      });
      setShowPostModal(false);
      setPostForm({ title: '', content: '', tags: '' });
      loadPosts();
    } catch (err) {}
  };

  const handlePostClick = (post) => {
    setActivePost(post);
    loadComments(post.id);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await authFetch(`/api/forum/posts/${activePost.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment.trim() }),
      });
      setNewComment('');
      loadComments(activePost.id);
      
      // Update local post comment count
      setPosts(posts.map(p => p.id === activePost.id ? { ...p, comments_count: p.comments_count + 1 } : p));
    } catch (err) {}
  };

  return (
    <div className="forum-root">
      <header className="forum-header">
        <div className="forum-header__left">
          <button className="forum-back" onClick={activePost ? () => setActivePost(null) : onBack}>
            <Icons.chevronDown style={{ transform: 'rotate(90deg)', width: 20 }} /> 
            {activePost ? 'Back to Discussions' : 'Back to Chat'}
          </button>
          <h2>Community Forum</h2>
        </div>
        {!activePost && (
          <button className="forum-btn-primary" onClick={() => setShowPostModal(true)}>
            + Start Discussion
          </button>
        )}
      </header>

      <main className="forum-content">
        {loading ? (
          <div className="forum-loading">Loading discussions...</div>
        ) : error ? (
          <div className="forum-error">{error}</div>
        ) : activePost ? (
          <div className="forum-post-view">
            <div className="post-detail-card">
              <div className="post-meta">
                <span className="post-author">{activePost.author_name}</span>
                <span className="post-date">{new Date(activePost.created_at).toLocaleString('en-IN')}</span>
              </div>
              <h3 className="post-title">{activePost.title}</h3>
              <p className="post-body">{activePost.content}</p>
              {activePost.tags.length > 0 && (
                <div className="post-tags">
                  {activePost.tags.map(t => <span key={t} className="post-tag">#{t}</span>)}
                </div>
              )}
            </div>

            <div className="comments-section">
              <h4>Discussion ({comments.length})</h4>
              <div className="comments-list">
                {comments.map((c) => (
                  <div key={c.id} className="comment-card">
                    <div className="comment-meta">
                      <span className="comment-author">{c.author_name}</span>
                      <span className="comment-date">{new Date(c.created_at).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' })}</span>
                    </div>
                    <p className="comment-body">{c.content}</p>
                  </div>
                ))}
              </div>
              
              <form className="comment-form" onSubmit={handleAddComment}>
                <textarea 
                  rows="3" 
                  placeholder="Share your advice or experience..." 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <div className="comment-form-actions">
                  <button type="submit" className="forum-btn-primary" disabled={!newComment.trim()}>Post Reply</button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="forum-feed">
            {posts.length === 0 ? (
              <p className="forum-empty">No discussions yet. Be the first to ask a question or share an experience!</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="post-card" onClick={() => handlePostClick(post)}>
                  <div className="post-card-left">
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-preview">{post.content}</p>
                    <div className="post-meta-bottom">
                      <span className="post-author">{post.author_name}</span>
                      <span className="post-date">• {new Date(post.created_at).toLocaleDateString('en-IN')}</span>
                      {post.tags.length > 0 && (
                        <span className="post-tags-preview">
                          • {post.tags.slice(0,2).map(t => `#${t}`).join(' ')}
                          {post.tags.length > 2 ? ` +${post.tags.length - 2}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="post-card-right">
                    <div className="post-comments-badge">
                      <Icons.receipt style={{ width: 14 }} /> {post.comments_count}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {showPostModal && (
        <div className="forum-modal-overlay">
          <div className="forum-modal">
            <h3>Start a Discussion</h3>
            <p className="forum-modal-sub">Ask for peer advice or share your legal journey.</p>
            <form onSubmit={handleCreatePost}>
              <div className="forum-field">
                <label>Topic Title</label>
                <input required value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} placeholder="e.g. Navigating consumer court for online fraud" />
              </div>
              <div className="forum-field">
                <label>Details</label>
                <textarea required rows="5" value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} placeholder="Explain your situation or advice..." />
              </div>
              <div className="forum-field">
                <label>Tags (comma separated)</label>
                <input value={postForm.tags} onChange={e => setPostForm({...postForm, tags: e.target.value})} placeholder="e.g. consumer_rights, fraud, advice" />
              </div>
              <div className="forum-modal-actions">
                <button type="button" onClick={() => setShowPostModal(false)}>Cancel</button>
                <button type="submit" className="forum-btn-primary">Post to Forum</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
