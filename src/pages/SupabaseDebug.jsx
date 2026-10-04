import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";

export default function SupabaseDebug() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, message, details = null) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date().toISOString() }]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);
    
    // Test 1: Check if Supabase client is initialized
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        addResult('Environment Variables', 'FAILED', 'Missing Supabase credentials', {
          url: supabaseUrl ? 'Set' : 'Missing',
          key: supabaseAnonKey ? 'Set' : 'Missing'
        });
      } else {
        addResult('Environment Variables', 'PASSED', 'Environment variables found', {
          url: supabaseUrl.substring(0, 20) + '...',
          key: supabaseAnonKey.substring(0, 20) + '...'
        });
      }
    } catch (error) {
      addResult('Environment Variables', 'FAILED', error.message);
    }

    // Test 2: Test Supabase connection
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addResult('Supabase Connection', 'FAILED', 'Cannot connect to Supabase', {
          error: error.message,
          status: error.status
        });
      } else {
        addResult('Supabase Connection', 'PASSED', 'Successfully connected to Supabase');
      }
    } catch (error) {
      addResult('Supabase Connection', 'FAILED', error.message);
    }

    // Test 3: Test signup with minimal data
    try {
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = 'test123456';
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });
      
      if (error) {
        addResult('Signup Test', 'FAILED', 'Signup endpoint error', {
          error: error.message,
          status: error.status,
          errorDetails: JSON.stringify(error, null, 2)
        });
      } else {
        addResult('Signup Test', 'PASSED', 'Signup endpoint working', {
          user: data.user ? 'User created' : 'No user',
          session: data.session ? 'Session created' : 'No session (email confirmation may be required)'
        });
        
        // Clean up test user if session exists
        if (data.user) {
          await supabase.auth.admin.deleteUser(data.user.id);
        }
      }
    } catch (error) {
      addResult('Signup Test', 'FAILED', error.message, {
        errorDetails: error.toString()
      });
    }

    // Test 4: Check profiles table access
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        addResult('Profiles Table', 'FAILED', 'Cannot access profiles table', {
          error: error.message,
          code: error.code
        });
      } else {
        addResult('Profiles Table', 'PASSED', 'Profiles table accessible');
      }
    } catch (error) {
      addResult('Profiles Table', 'FAILED', error.message);
    }

    // Test 5: Check orders table access
    try {
      const { error } = await supabase.from('orders').select('id').limit(1);
      if (error) {
        addResult('Orders Table', 'FAILED', 'Cannot access orders table', {
          error: error.message,
          code: error.code
        });
      } else {
        addResult('Orders Table', 'PASSED', 'Orders table accessible');
      }
    } catch (error) {
      addResult('Orders Table', 'FAILED', error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Diagnostics</h1>
        
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 mb-6"
        >
          {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </button>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'PASSED' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{result.test}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    result.status === 'PASSED' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{result.message}</p>
                {result.details && (
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
                <p className="text-xs text-gray-500 mt-2">{result.timestamp}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold mb-2">Common Issues:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Missing or invalid VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local</li>
            <li>Supabase project is paused or suspended</li>
            <li>Email confirmation is disabled in Supabase settings</li>
            <li>Site URL and redirect URLs not configured in Supabase</li>
            <li>Supabase project has reached free tier limits</li>
          </ul>
        </div>
      </div>
    </div>
  );
}