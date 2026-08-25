import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Image, Type, Save, Loader2 } from "lucide-react";
import AdminSiteScopeSwitcher from "@/components/admin/AdminSiteScopeSwitcher";

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type?: string;
  site_scope?: string;
  description?: string | null;
}

const PAYMENT_KEYS = new Set([
  'bkash_marchent_id', 'bkash_secret', 'bkash_key', 
  'nagad_marchent_id', 'payment_enabled', 'bkash_enabled', 
  'nagad_enabled', 'manual_bkash_number', 'manual_nagad_number'
]);

const SiteSettingsManagement = ({ filter }: { filter?: 'general' | 'payment' } = {}) => {
  const queryClient = useQueryClient();
  const scope = "learn";
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings', scope],
    queryFn: async () => {
      // Fetch settings for current scope. Fallback to agency template for missing keys on learn scope.
      const { data: scopeRows, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('site_scope', scope)
        .order('setting_key');
      if (error) throw error;

      if (scope === 'learn') {
        // Ensure the same keys as agency are visible for editing (so admin can create learn overrides)
        const { data: agencyRows } = await supabase
          .from('site_settings')
          .select('*')
          .eq('site_scope', 'agency')
          .order('setting_key');
        const learnKeys = new Set((scopeRows || []).map((r: any) => r.setting_key));
        const shims = (agencyRows || [])
          .filter((r: any) => !learnKeys.has(r.setting_key))
          .map((r: any) => ({ ...r, id: `shim-${r.setting_key}`, setting_value: '', site_scope: 'learn' }));
        return [...(scopeRows || []), ...shims] as SiteSetting[];
      }

      return scopeRows as SiteSetting[];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value, type }: { key: string; value: string; type: string }) => {
      // upsert scoped row
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', key)
        .eq('site_scope', scope)
        .maybeSingle();
      if (existing?.id) {
        const { error } = await supabase.from('site_settings').update({ setting_value: value }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([{ setting_key: key, setting_value: value, setting_type: type, site_scope: scope }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Settings updated!');
    },
    onError: () => {
      toast.error('Failed to update settings');
    }
  });


  const handleChange = (key: string, value: string) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string, type: string) => {
    const value = editedSettings[key];
    if (value !== undefined) {
      updateMutation.mutate({ key, value, type });
      setEditedSettings(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  const handleToggle = (key: string, currentValue: string | null, type: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    updateMutation.mutate({ key, value: newValue, type });
  };


  const getSettingLabel = (key: string) => {
    const labels: Record<string, string> = {
      'favicon_url': 'Favicon URL',
      'logo_url': 'Logo URL',
      'site_name': 'Site Name',
      'bkash_number': 'Bkash Number',
      'nagad_number': 'Nagad Number',
      'bkash_enabled': 'Bkash Payment',
      'nagad_enabled': 'Nagad Payment',
    };
    return labels[key] || key;
  };

  const getSettingDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      'favicon_url': 'Small icon shown on browser tab (URL)',
      'logo_url': 'Site main logo (URL)',
      'site_name': 'Site name',
      'bkash_number': 'Bkash number for course payments',
      'nagad_number': 'Nagad number for course payments',
      'bkash_enabled': 'Toggle Bkash manual payment option',
      'nagad_enabled': 'Toggle Nagad manual payment option',
    };
    return descriptions[key] || '';
  };

  const getSettingIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredAll = (settings || []).filter(s => {
    if (filter === 'payment') return PAYMENT_KEYS.has(s.setting_key);
    if (filter === 'general') return !PAYMENT_KEYS.has(s.setting_key);
    return true;
  });
  const toggleSettings = filteredAll.filter(s => s.setting_type === 'toggle');
  const otherSettings = filteredAll.filter(s => s.setting_type !== 'toggle');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">
              {filter === 'payment' ? 'Payment Method' : filter === 'general' ? 'Site Settings' : 'Site Settings'}
            </h2>
            <p className="text-muted-foreground">
              {scope === "learn" ? "Learn Site" : "Agency Site"} — {filter === 'payment' ? 'Bkash, Nagad & manual payment options' : 'Favicon, Logo & Site name'}
            </p>
          </div>
        </div>
        <AdminSiteScopeSwitcher />
      </div>


      {/* Toggle Settings - bKash/Nagad on/off */}
      {toggleSettings.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">💳 Payment Options</CardTitle>
            <CardDescription>Toggle manual payment method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {toggleSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30">
                <div>
                  <p className="font-medium">{getSettingLabel(setting.setting_key)}</p>
                  <p className="text-xs text-muted-foreground">{getSettingDescription(setting.setting_key)}</p>
                </div>
                <Switch
                  checked={setting.setting_value === 'true'}
                  onCheckedChange={() => handleToggle(setting.setting_key, setting.setting_value, setting.setting_type)}
                  disabled={updateMutation.isPending}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {otherSettings.map((setting) => {
          const currentValue = editedSettings[setting.setting_key] ?? setting.setting_value ?? '';
          const hasChanges = editedSettings[setting.setting_key] !== undefined;
          
          return (
            <Card key={setting.id} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {getSettingIcon(setting.setting_type)}
                  <CardTitle className="text-lg">{getSettingLabel(setting.setting_key)}</CardTitle>
                </div>
                <CardDescription>{getSettingDescription(setting.setting_key)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {setting.setting_type === 'image' && currentValue && (
                  <div className="relative h-20 w-20 rounded-lg border border-border overflow-hidden bg-secondary">
                    <img 
                      src={currentValue} 
                      alt={setting.setting_key}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor={setting.setting_key}>
                    {setting.setting_type === 'image' ? 'Image URL' : 'Value'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={setting.setting_key}
                      value={currentValue}
                      onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                      placeholder={setting.setting_type === 'image' ? 'https://example.com/image.png' : 'Enter value'}
                    />
                    <Button 
                      size="icon" 
                      onClick={() => handleSave(setting.setting_key, setting.setting_type)}
                      disabled={!hasChanges || updateMutation.isPending}
                      variant={hasChanges ? "default" : "secondary"}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">💡 Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• For favicon, use .ico, .png or .svg files (32x32 or 64x64 pixels)</p>
          <p>• For logo, use transparent PNG</p>
          <p>• Before providing image URL, ensure the link is publicly accessible</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteSettingsManagement;
