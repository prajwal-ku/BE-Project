"use client"

import React, { useState, useEffect } from 'react';
import { blockchainService } from '@/services/blockchainService';
import { Wallet, Loader2, CheckCircle, AlertCircle, Shield, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface MetaMaskConnectProps {
  onConnected?: (account: string) => void;
  onDisconnected?: () => void;
  className?: string;
  showBalance?: boolean;
}

export function MetaMaskConnect({ 
  onConnected, 
  onDisconnected, 
  className = '',
  showBalance = false 
}: MetaMaskConnectProps) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [web3, setWeb3] = useState<any>(null);

  // Check if already connected on mount
  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
          if (showBalance) {
            await fetchBalance(accounts[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const fetchBalance = async (address: string) => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const web3Instance = new (await import('web3')).default((window as any).ethereum);
        const balanceWei = await web3Instance.eth.getBalance(address);
        const balanceEth = web3Instance.utils.fromWei(balanceWei, 'ether');
        setBalance(parseFloat(balanceEth).toFixed(4));
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const connectWallet = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      const success = await blockchainService.init();
      
      if (success) {
        const account = blockchainService.getAccount();
        setConnected(true);
        setAccount(account);
        
        if (showBalance && account) {
          await fetchBalance(account);
        }
        
        // Update profile in Supabase with wallet address
        await updateProfileWithWallet(account!);
        
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
        const { error } = await supabase
          .from('profiles')
          .update({ wallet_address: walletAddress })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating profile:', error);
        } else {
          console.log('✅ Wallet address saved to profile');
        }
      }
    } catch (error) {
      console.error('Error updating profile with wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setAccount(null);
    setBalance(null);
    if (onDisconnected) {
      onDisconnected();
    }
  };

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (connected && account) {
    return (
      <div className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden ${className}`}>
        <div className="p-3 bg-green-900/20 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-400">Connected</span>
          </div>
          <Button
            onClick={disconnectWallet}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-gray-400 hover:text-white"
          >
            Disconnect
          </Button>
        </div>
        
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Address</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono text-white">
                {account.substring(0, 6)}...{account.substring(38)}
              </span>
              <button 
                onClick={copyAddress}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Copy address"
              >
                <Copy className="h-3 w-3 text-gray-400" />
              </button>
            </div>
          </div>
          
          {showBalance && balance && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Balance</span>
              <span className="text-xs font-medium text-white">{balance} ETH</span>
            </div>
          )}
          
          <div className="pt-2 mt-1 border-t border-gray-700">
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <Shield className="h-3 w-3" />
              <span>Ready for Blockchain</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        onClick={connectWallet}
        disabled={connecting}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
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
        <div className="mt-2 p-2 bg-red-900/30 border border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-red-400">{error}</p>
            <p className="text-xs text-gray-500 mt-1">
              Make sure MetaMask is installed and Ganache is running
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500">
          Need MetaMask?{' '}
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-orange-500 hover:text-orange-400"
          >
            Install now
          </a>
        </p>
      </div>
    </div>
  );
}