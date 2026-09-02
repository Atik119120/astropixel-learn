import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, Power, Trash2, RefreshCw, Code, Webhook, Palette } from 'lucide-react';
import ImageUploader from './ImageUploader';

interface Client {
  id: string;
  name: string;
  owner_email: string | null;
  website_url: string | null;
  api_key_prefix: string;
  is_active: boolean;
  webhook_url: string | null;
  webhook_secret: string | null;
  logo_url: string | null;
  brand_color: string | null;
  checkout_title: string | null;
  checkout_description: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  invoice_id: string;
  external_reference: string | null;
  amount: number;
  status: string;
  customer_email: string | null;
  client_id: string;
  created_at: string;
  paid_at: string | null;
}

import { SUPABASE_PROJECT_ID as PROJECT_REF } from "@/lib/env";
const FN_BASE = `https://${PROJECT_REF}.functions.supabase.co`;

function genKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `az_live_${hex}`;
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function PaymentApiManagement() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [editWebhook, setEditWebhook] = useState<Client | null>(null);
  const [editBrand, setEditBrand] = useState<Client | null>(null);
  const [webhookForm, setWebhookForm] = useState({ webhook_url: '', webhook_secret: '' });
  const [brandForm, setBrandForm] = useState({ logo_url: '', brand_color: '#3B82F6', checkout_title: '', checkout_description: '' });
  const [form, setForm] = useState({ name: '', owner_email: '', website_url: '', webhook_url: '', webhook_secret: '' });

  const load = async () => {
    setLoading(true);
    const [c, p] = await Promise.all([
      supabase.from('api_clients').select('*').order('created_at', { ascending: false }),
      supabase.from('api_payments').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    setClients((c.data as any) || []);
    setPayments((p.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createClient = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    const key = genKey();
    const hash = await sha256(key);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('api_clients').insert({
      name: form.name.trim(),
      owner_email: form.owner_email || null,
      website_url: form.website_url || null,
      webhook_url: form.webhook_url || null,
      webhook_secret: form.webhook_secret || null,
      api_key_hash: hash,
      api_key_prefix: key.slice(0, 12),
      created_by: user?.uid,
    });
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    setShowCreate(false);
    setForm({ name: '', owner_email: '', website_url: '', webhook_url: '', webhook_secret: '' });
    setShowKey(key);
    load();
  };

  const openWebhookEdit = (c: Client) => {
    setWebhookForm({ webhook_url: c.webhook_url || '', webhook_secret: c.webhook_secret || '' });
    setEditWebhook(c);
  };

  const saveWebhook = async () => {
    if (!editWebhook) return;
    const { error } = await supabase.from('api_clients').update({
      webhook_url: webhookForm.webhook_url || null,
      webhook_secret: webhookForm.webhook_secret || null,
    }).eq('id', editWebhook.id);
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Webhook updated' });
    setEditWebhook(null);
    load();
  };

  const openBrandEdit = (c: Client) => {
    setBrandForm({
      logo_url: c.logo_url || '',
      brand_color: c.brand_color || '#3B82F6',
      checkout_title: c.checkout_title || '',
      checkout_description: c.checkout_description || '',
    });
    setEditBrand(c);
  };

  const saveBrand = async () => {
    if (!editBrand) return;
    const { error } = await supabase.from('api_clients').update({
      logo_url: brandForm.logo_url || null,
      brand_color: brandForm.brand_color || null,
      checkout_title: brandForm.checkout_title || null,
      checkout_description: brandForm.checkout_description || null,
    }).eq('id', editBrand.id);
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Branding updated' });
    setEditBrand(null);
    load();
  };

  const genSecret = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return 'whsec_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const toggleActive = async (c: Client) => {
    await supabase.from('api_clients').update({ is_active: !c.is_active }).eq('id', c.id);
    load();
  };

  const deleteClient = async (c: Client) => {
    if (!confirm(`Delete ${c.name}? All payment records remain but key stops working.`)) return;
    await supabase.from('api_clients').delete().eq('id', c.id);
    load();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Payment API — External Sites</h2>
          <p className="text-sm text-muted-foreground">Provide your UddoktaPay gateway to other sites. Each site can accept payments using an API key.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" />New Client</Button>
        </div>
      </div>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="docs"><Code className="w-4 h-4 mr-1" />API Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-3">
          {clients.length === 0 && <p className="text-sm text-muted-foreground">No clients yet.</p>}
          {clients.map(c => (
            <Card key={c.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{c.name}</h3>
                  <Badge variant={c.is_active ? 'default' : 'secondary'}>
                    {c.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {c.owner_email} · {c.website_url} · key: <code>{c.api_key_prefix}…</code>
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  Webhook: {c.webhook_url ? <code>{c.webhook_url}</code> : <span className="italic">none</span>}
                  {c.webhook_secret && <Badge variant="outline" className="ml-2">HMAC signed</Badge>}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openBrandEdit(c)} title="Branding">
                  <Palette className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => openWebhookEdit(c)} title="Edit Webhook">
                  <Webhook className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(c)}>
                  <Power className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteClient(c)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payments" className="space-y-2">
          {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
          {payments.map(p => {
            const client = clients.find(c => c.id === p.client_id);
            return (
              <Card key={p.id} className="p-3 flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{p.invoice_id}</code>
                    <Badge variant={p.status === 'paid' ? 'default' : p.status === 'failed' ? 'destructive' : 'secondary'}>
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {client?.name || '—'} · {p.customer_email} · {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="font-semibold">৳{Number(p.amount).toFixed(2)}</div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="docs">
          <Card className="p-4 space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Base URL</h3>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-xs flex-1">{FN_BASE}</code>
                <Button size="sm" variant="ghost" onClick={() => copy(FN_BASE)}><Copy className="w-3 h-3" /></Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-1">1. Create Payment</h3>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{`POST ${FN_BASE}/api-create-payment
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "amount": 500,
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "01700000000",
  "redirect_url": "https://yoursite.com/payment-result",
  "external_reference": "ORDER-123",
  "metadata": { "product": "Pro Plan" }
}

→ { "success": true, "invoice_id": "AZ-...", "payment_url": "https://astropixel.tech/pay/AZ-..." }`}</pre>
              <p className="text-xs text-muted-foreground mt-1">Redirect the user to <code>payment_url</code> . This will show a <strong>branded checkout page</strong> (with your logo + brand color). When the Pay button is clicked, the user will go to the UddoktaPay gateway and return to your <code>redirect_url</code> after payment — with <code>invoice_id</code> and <code>status</code> in the query parameters.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">🎨 Branding</h3>
              <p className="text-xs text-muted-foreground">From the client list, click the <Palette className="w-3 h-3 inline" /> icon to set logo, brand color, title, description. These will be shown on the checkout page.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">2. Verify Payment</h3>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{`GET ${FN_BASE}/api-verify-payment?invoice_id=AZ-XXXX
Authorization: Bearer <API_KEY>

→ {
  "success": true,
  "invoice_id": "AZ-...",
  "status": "paid",
  "amount": 500,
  "transaction_id": "...",
  "paid_at": "2026-..."
}`}</pre>
              <p className="text-xs text-muted-foreground mt-1">After user redirect, call this endpoint from your server to verify status. <code>status === "paid"</code> If successful, grant access.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">3. Webhook (Optional)</h3>
              <p className="text-xs text-muted-foreground">If a Webhook URL is set, we will send a POST request to your URL upon payment completion — with the same JSON body. <code>X-Signature</code> A HMAC-SHA256 signature will be included in the header (if a webhook secret is provided).</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New API Client</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Amin One" /></div>
            <div><Label>Owner Email</Label><Input value={form.owner_email} onChange={e => setForm({ ...form, owner_email: e.target.value })} placeholder="owner@site.com" /></div>
            <div><Label>Website URL</Label><Input value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://aminonebd.com" /></div>
            <div><Label>Webhook URL (optional)</Label><Input value={form.webhook_url} onChange={e => setForm({ ...form, webhook_url: e.target.value })} placeholder="https://site.com/api/payment-webhook" /></div>
            <div>
              <Label>Webhook Secret (HMAC, optional)</Label>
              <div className="flex gap-2">
                <Input value={form.webhook_secret} onChange={e => setForm({ ...form, webhook_secret: e.target.value })} placeholder="whsec_..." className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={() => setForm({ ...form, webhook_secret: genSecret() })}>Generate</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">If set, we will send a <code>X-Signature: sha256=...</code> header with each webhook. Use this secret to verify on the client side.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createClient} disabled={loading}>Create & Generate Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showKey} onOpenChange={() => setShowKey(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>API Key — Save Now!</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This key will not be shown again. Copy it now and keep it in a safe place.</p>
          <div className="flex gap-2">
            <Input readOnly value={showKey || ''} className='font-mono text-xs' />
            <Button onClick={() => showKey && copy(showKey)}><Copy className="w-4 h-4" /></Button>
          </div>
          <DialogFooter><Button onClick={() => setShowKey(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editWebhook} onOpenChange={() => setEditWebhook(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Webhook — {editWebhook?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Webhook URL</Label>
              <Input value={webhookForm.webhook_url} onChange={e => setWebhookForm({ ...webhookForm, webhook_url: e.target.value })} placeholder="https://site.com/api/payment-webhook" />
            </div>
            <div>
              <Label>Webhook Secret (HMAC)</Label>
              <div className="flex gap-2">
                <Input value={webhookForm.webhook_secret} onChange={e => setWebhookForm({ ...webhookForm, webhook_secret: e.target.value })} placeholder="whsec_..." className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={() => setWebhookForm({ ...webhookForm, webhook_secret: genSecret() })}>Generate</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Upon payment completion, we will send <code>POST</code> and add a <code>X-Signature: sha256=HMAC(secret, body)</code> header.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditWebhook(null)}>Cancel</Button>
            <Button onClick={saveWebhook}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editBrand} onOpenChange={() => setEditBrand(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Checkout Branding — {editBrand?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Logo</Label>
              <ImageUploader
                value={brandForm.logo_url}
                onChange={(url) => setBrandForm({ ...brandForm, logo_url: url })}
                folder="payment-branding"
                label=""
              />
            </div>
            <div>
              <Label>Brand Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={brandForm.brand_color} onChange={e => setBrandForm({ ...brandForm, brand_color: e.target.value })} className="w-20 h-10 p-1" />
                <Input value={brandForm.brand_color} onChange={e => setBrandForm({ ...brandForm, brand_color: e.target.value })} placeholder="#3B82F6" className="font-mono" />
              </div>
            </div>
            <div>
              <Label>Checkout Title</Label>
              <Input value={brandForm.checkout_title} onChange={e => setBrandForm({ ...brandForm, checkout_title: e.target.value })} placeholder="Pay Amin One BD" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={brandForm.checkout_description} onChange={e => setBrandForm({ ...brandForm, checkout_description: e.target.value })} placeholder="Complete your order" />
            </div>
            <p className="text-xs text-muted-foreground">This branding will be displayed on the checkout page <code>{`/pay/<invoice_id>`}</code> .</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBrand(null)}>Cancel</Button>
            <Button onClick={saveBrand}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
