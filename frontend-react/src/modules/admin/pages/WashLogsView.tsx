import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import api from '../../../shared/services/api';

export const WashLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/wash/logs?page=${p}&limit=12`);
      setLogs(response.data.items || []);
      setTotal(response.data.total || 0);
      setPage(response.data.page || 1);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching wash logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const filteredLogs = logs.filter((item) =>
    item.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.paymentReference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Title & Actions Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-cyan)', marginBottom: '0.3rem' }}>
            <ClipboardList size={24} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>REGISTRO DE OPERACIONES</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Entradas a Bahía de Lavado</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Auditoría de todos los vehículos que han ingresado mediante talanquera Arduino y pasarela Wompi
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => fetchLogs(page)}
            className="btn-secondary"
            style={{ fontSize: '0.875rem' }}
          >
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por placa o referencia Wompi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.9rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Total registros: <strong style={{ color: '#fff' }}>{total}</strong>
        </div>
      </div>

      {/* Main Logs Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>PLACA</th>
                <th style={{ padding: '0.85rem 1rem' }}>PLAN DE LAVADO</th>
                <th style={{ padding: '0.85rem 1rem' }}>MONTO (COP)</th>
                <th style={{ padding: '0.85rem 1rem' }}>ESTADO PAGO</th>
                <th style={{ padding: '0.85rem 1rem' }}>REFERENCIA WOMPI</th>
                <th style={{ padding: '0.85rem 1rem' }}>FASE ARDUINO</th>
                <th style={{ padding: '0.85rem 1rem' }}>FECHA / HORA</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#06b6d4' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                    Cargando entradas...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron registros de entrada coincidentes.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <td style={{ padding: '1rem', fontWeight: 700 }}>
                      <span
                        style={{
                          background: '#facc15',
                          color: '#0f172a',
                          fontFamily: 'monospace',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid #000',
                          fontSize: '0.85rem',
                        }}
                      >
                        {log.licensePlate}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{log.plan}</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      ${Number(log.amount).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={log.paymentStatus === 'APPROVED' ? 'badge badge-success' : 'badge badge-warning'}>
                        {log.paymentStatus === 'APPROVED' ? 'APROBADO' : log.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                      {log.paymentReference}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        className={
                          log.stage === 'STAGE_FINISHED'
                            ? 'badge badge-success'
                            : log.stage.startsWith('STAGE_')
                            ? 'badge badge-info'
                            : 'badge badge-warning'
                        }
                      >
                        {log.stage}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(log.createdAt).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-glass)',
            marginTop: '1rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Página {page} de {totalPages || 1}
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
