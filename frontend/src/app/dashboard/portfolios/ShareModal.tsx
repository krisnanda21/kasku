'use client';

import { useState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleInvitationAction, updateInvitationRoleAction, regenerateInvitationAction, removeMemberAction, getInvitationAction, getMembersAction } from '@/app/actions/portfolio';
import ConfirmModal from '@/components/ui/ConfirmModal';
import CustomSelect from '@/components/ui/CustomSelect';

interface ShareModalProps {
  portfolioId: string;
  onClose: () => void;
}

export default function ShareModal({ portfolioId, onClose }: ShareModalProps) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [portfolioId]);

  const fetchData = async () => {
    try {
      const [invData, memData] = await Promise.all([
        getInvitationAction(portfolioId),
        getMembersAction(portfolioId)
      ]);

      if (invData) {
        setInvitation(invData);
      }
      if (memData) {
        setMembers(memData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!invitation) return;
    const link = `${window.location.origin}/invite?token=${invitation.token}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleActive = async () => {
    if (!invitation) return;
    setInvitation({ ...invitation, is_active: !invitation.is_active }); // Optimistic
    await toggleInvitationAction(portfolioId, invitation.token);
    fetchData(); // Refetch to sync
  };

  const handleRoleChange = async (newRole: string) => {
    if (!invitation) return;
    setInvitation({ ...invitation, role: newRole }); // Optimistic
    await updateInvitationRoleAction(portfolioId, invitation.token, newRole);
    fetchData();
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await regenerateInvitationAction(portfolioId);
    setShowRegenerateConfirm(false);
    setIsRegenerating(false);
    fetchData();
  };

  const executeRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    await removeMemberAction(portfolioId, memberToRemove.user_id);
    setIsRemoving(false);
    setMemberToRemove(null);
    fetchData();
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Bagikan Portofolio</h2>

      {/* Link Section */}
      <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 600 }}>Link Undangan</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Status: {invitation?.is_active ? <span style={{ color: 'var(--success)' }}>Aktif</span> : <span style={{ color: 'var(--danger)' }}>Nonaktif</span>}
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}>
            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Aktifkan Link</span>
            <div style={{
              width: '2.5rem',
              height: '1.25rem',
              backgroundColor: invitation?.is_active ? 'var(--primary)' : 'var(--border-color)',
              borderRadius: '1rem',
              position: 'relative',
              transition: 'background-color 0.3s'
            }}>
              <div style={{
                width: '1rem',
                height: '1rem',
                backgroundColor: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '0.125rem',
                left: invitation?.is_active ? '1.375rem' : '0.125rem',
                transition: 'left 0.3s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </div>
            <input
              type="checkbox"
              checked={invitation?.is_active || false}
              onChange={handleToggleActive}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', opacity: invitation?.is_active ? 1 : 0.5 }}>
          <input
            type="text"
            readOnly
            value={invitation ? `${window.location.origin}/invite?token=${invitation.token}` : ''}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}
          />
          <button
            onClick={handleCopy}
            disabled={!invitation?.is_active}
            className="btn btn-primary"
          >
            {isCopied ? 'Tersalin!' : 'Salin Link'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '250px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Anyone with the Link can:</span>
            <div style={{ flex: 1, opacity: invitation?.is_active ? 1 : 0.5, pointerEvents: invitation?.is_active ? 'auto' : 'none' }}>
              <CustomSelect
                value={invitation?.role || 'view'}
                onChange={handleRoleChange}
                options={[
                  { value: 'view', label: 'View' },
                  { value: 'edit', label: 'Edit' }
                ]}
              />
            </div>
          </div>
          <button
            onClick={() => setShowRegenerateConfirm(true)}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--danger)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
          >
            Regenerate Link
          </button>
        </div>
      </div>

      {/* Members Section */}
      <div>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Anggota ({members.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {members.map(member => (
            <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
              <div>
                <p style={{ fontWeight: 500 }}>{member.user.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.user.email}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.25rem' }}>
                  {member.role === 'owner' ? 'Owner' : 'Anggota'}
                </span>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => setMemberToRemove(member)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}
                    title="Hapus Anggota"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={showRegenerateConfirm}
        title="Regenerate Link?"
        message="Link yang lama akan langsung tidak berlaku. Orang yang belum sempat klik link lama tidak akan bisa bergabung kecuali Anda memberikan link yang baru ini."
        confirmText="Ya, Buat Baru"
        isDanger={true}
        isLoading={isRegenerating}
        onConfirm={handleRegenerate}
        onCancel={() => setShowRegenerateConfirm(false)}
      />

      <ConfirmModal
        isOpen={!!memberToRemove}
        title="Hapus Anggota"
        message={`Apakah Anda yakin ingin menghapus ${memberToRemove?.user?.name || 'anggota ini'} dari portofolio ini? Mereka akan kehilangan seluruh akses ke transaksi dan data portofolio ini.`}
        confirmText="Ya, Hapus"
        isDanger={true}
        isLoading={isRemoving}
        onConfirm={executeRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
}
