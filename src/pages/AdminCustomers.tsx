import { useState, useEffect } from 'react';
import { Users, Mail, Phone, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface Customer {
  id: string;
  display_name: string;
  phone_number: string;
  how_found_us: string | null;
  created_at: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase
      .from('user_profiles')
      .select('id, display_name, phone_number, how_found_us, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setCustomers(data as Customer[]);
        setLoading(false);
      });
  }, []);

  const filtered = customers.filter(c =>
    c.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone_number.includes(searchQuery)
  );

  return (
    <AdminLayout title="Customers" subtitle="Manage your customer base">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="card-luxury p-4">
          <Users className="w-6 h-6 text-gold mb-2" />
          <div className="text-2xl font-bold text-foreground">{customers.length}</div>
          <div className="text-muted-foreground text-sm">Total Customers</div>
        </div>
        <div className="card-luxury p-4">
          <Mail className="w-6 h-6 text-gold mb-2" />
          <div className="text-2xl font-bold text-foreground">
            {new Set(customers.map(c => c.how_found_us).filter(Boolean)).size}
          </div>
          <div className="text-muted-foreground text-sm">Referral Sources</div>
        </div>
        <div className="card-luxury p-4">
          <Phone className="w-6 h-6 text-gold mb-2" />
          <div className="text-2xl font-bold text-foreground">
            {customers.filter(c => c.phone_number).length}
          </div>
          <div className="text-muted-foreground text-sm">With Phone</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground"
          />
        </div>
      </div>

      {/* Loading / Empty / Grid */}
      {loading ? (
        <div className="card-luxury p-10 text-center text-muted-foreground">Loading customers…</div>
      ) : filtered.length === 0 ? (
        <div className="card-luxury p-10 text-center">
          <Users className="w-10 h-10 text-gold mx-auto mb-3" />
          <p className="text-muted-foreground">
            {customers.length === 0 ? 'No customers yet. They appear here when someone signs up.' : 'No customers match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(customer => (
            <div key={customer.id} className="card-luxury p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-gold font-bold text-lg">{customer.display_name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{customer.display_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {customer.phone_number}
                </div>
                {customer.how_found_us && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Search className="w-4 h-4" />
                    Found via: {customer.how_found_us}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCustomers;
