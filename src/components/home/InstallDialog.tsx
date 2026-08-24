import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Smartphone, Download, Chrome, ExternalLink, CheckCircle2 } from 'lucide-react';
import { promptInstall } from '@/lib/pwa-install';
import { toast } from 'sonner';

interface InstallDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Shows when a user clicks any download button.
 * Tries the browser PWA install prompt first; if unavailable, shows
 * step-by-step instructions and a link to PWABuilder for a native installer.
 */
const InstallDialog = ({ open, onClose }: InstallDialogProps) => {
  const [installing, setInstalling] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (!open) return;
    import('@/lib/pwa-install').then(({ canInstallPWA }) => {
      setCanInstall(canInstallPWA());
    });
  }, [open]);

  const handleInstall = async () => {
    setInstalling(true);
    const outcome = await promptInstall();
    setInstalling(false);
    if (outcome === 'accepted') {
      toast.success('Haamkay is installing on your device!');
      onClose();
    } else if (outcome === 'dismissed') {
      toast.info('Install dismissed. You can try again anytime.');
    } else {
      toast.info('Your browser doesn't support one-click install here. Follow the steps below.');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-card border border-gold/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-teal-deep to-teal-darker">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center">
                  <Download className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-foreground">Download Haamkay</h2>
                  <p className="text-xs text-muted-foreground">Install on your device for the full experience</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* One-click install (when beforeinstallprompt is available) */}
              {canInstall && (
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="w-full btn-gold flex items-center justify-center gap-2 !py-3 text-base"
                >
                  <Download className="w-5 h-5" />
                  {installing ? 'Installing…' : 'Install Now — One Click'}
                </button>
              )}

              {/* Manual install instructions */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Chrome className="w-4 h-4 text-gold" />
                  Install from your browser (Chrome / Edge)
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-gold font-bold flex-shrink-0">1.</span>
                    Look for the <span className="text-foreground font-medium">install icon</span> (⊕) in the address bar
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold font-bold flex-shrink-0">2.</span>
                    Click it and choose <span className="text-foreground font-medium">"Install Haamkay"</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold font-bold flex-shrink-0">3.</span>
                    The app appears on your desktop / start menu and opens in its own window
                  </li>
                </ol>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Native Windows installer via PWABuilder */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-gold" />
                  Get a native Windows installer (.exe / .msix)
                </p>
                <p className="text-xs text-muted-foreground">
                  Generate a free Windows desktop installer from this website using Microsoft's PWABuilder:
                </p>
                <a
                  href="https://www.pwabuilder.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-gold/40 text-gold hover:bg-gold/10 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open PWABuilder.com
                </a>
                <p className="text-[11px] text-muted-foreground">
                  Paste this site's URL there → click "Build My PWA" → download the Windows package → run the installer on your PC.
                </p>
              </div>

              {/* Feature list */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                {['Works offline', 'Desktop shortcut', 'Push notifications', 'Auto-updates'].map(feat => (
                  <span key={feat} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-gold" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallDialog;
