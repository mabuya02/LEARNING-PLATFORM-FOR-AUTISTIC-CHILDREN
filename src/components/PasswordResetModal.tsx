import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface PasswordResetModalProps {
  isOpen: boolean;
  userEmail: string;
  onPasswordChanged: () => void;
}

export function PasswordResetModal({ isOpen, userEmail, onPasswordChanged }: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation
  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
    }
    return { valid: true };
  };

  const handlePasswordReset = async () => {
    setError(null);

    // Validation checks
    if (!newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || 'Invalid password');
      return;
    }

    setIsResetting(true);

    try {
      // Update the password directly (user is already authenticated via email confirmation)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found');
      }

      // Update first_login flag in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ first_login: false })
        .eq('id', user.id);

      if (profileError) {
        console.warn('Warning: Failed to update first_login flag:', profileError);
      } else {
        console.log('✅ first_login flag updated to false');
      }

      toast.success('Password created successfully!', {
        description: 'You can now access the system with your new password.',
      });

      // Clear form
      setNewPassword('');
      setConfirmPassword('');

      // Notify parent component
      onPasswordChanged();
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const passwordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    const validation = validatePassword(password);
    if (!validation.valid) return 'weak';
    if (password.length >= 12 && /[!@#$%^&*].*[!@#$%^&*]/.test(password)) return 'strong';
    return 'medium';
  };

  const strength = newPassword ? passwordStrength(newPassword) : null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-6 w-6 text-orange-500" />
            <DialogTitle className="text-xl">Welcome! Create Your Password</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            To secure your account, please create a strong password that you'll use for future logins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Create Your Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              disabled={isResetting}
              autoFocus
            />
            {strength && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      strength === 'weak'
                        ? 'w-1/3 bg-red-500'
                        : strength === 'medium'
                        ? 'w-2/3 bg-yellow-500'
                        : 'w-full bg-green-500'
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-600 capitalize">{strength}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={isResetting}
            />
            {confirmPassword && newPassword === confirmPassword && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Passwords match</span>
              </div>
            )}
          </div>

          {/* Password Requirements */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Password Requirements:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character (!@#$%^&*)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            onClick={handlePasswordReset}
            disabled={isResetting || !newPassword || !confirmPassword}
            className="w-full sm:w-auto"
          >
            {isResetting ? 'Creating Password...' : 'Create Password'}
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-blue-800">
            ℹ️ <strong>Note:</strong> You must create a password to access your account. This is a one-time setup.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
