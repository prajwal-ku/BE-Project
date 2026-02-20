import React, { useState, useEffect } from 'react';
import { blockchainService } from '@/services/blockchainService';
import { Wallet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MetaMaskConnectProps {
  onConnected?: (account: string) => void;
  className?: string;
}

export function MetaMaskConnect({ onConnected, className }: MetaMaskConnectProps) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      const success = await blockchainService.init();
      
      if (success) {
        const account = blockchainService.getAccount();
        setConnected(true);
        setAccount(account);
        
        // Update profile in Supabase with wallet address
        await updateProfileWithWallet(account);
        
        if (onConnected) {
          onConnected(account!);
        }
      } else {
        setError('Failed to connect to MetaMask');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const updateProfileWithWallet = async (walletAddress: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('profiles')
          .update({ wallet_address: walletAddress })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating profile with wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setAccount(null);
    // Note: Can't actually disconnect from MetaMask, just clear local state
  };

  if (connected && account) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-green-900/30 border border-green-800 rounded-lg ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm text-green-400">
          {account.substring(0, 6)}...{account.substring(38)}
        </span>
        <Button
          onClick={disconnectWallet}
          variant="ghost"
          size="sm"
          className="text-xs text-gray-400 hover:text-white"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        onClick={connectWallet}
        disabled={connecting}
        className="bg-orange-500 hover:bg-orange-600 text-white w-full"
      >
        {connecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4 mr-2" />
            Connect MetaMask
          </>
        )}
      </Button>
      
      {error && (
        <div className="mt-2 p-2 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

// Don't forget to import createClient
import { createClient } from '@/lib/supabase/client';