/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for Node.js modules in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        process: false,
        buffer: false,
        util: false,
        http: false,
        https: false,
        zlib: false,
        url: false,
        assert: false,
        child_process: false,
        worker_threads: false,
        perf_hooks: false,
      };
    }
    
    // Ignore warnings from blockchain packages
    config.ignoreWarnings = [
      { module: /node_modules\/web3/ },
      { module: /node_modules\/@metamask/ },
    ];
    
    return config;
  },
  
  // Allow transpiling specific packages
  transpilePackages: [
    'web3',
    '@metamask/detect-provider',
    'ethers'
  ],
  
  // Environment variables that will be available to the browser
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  },
  
  // For production builds
  output: 'standalone',
};

export default nextConfig;