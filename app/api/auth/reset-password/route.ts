import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Strategy 1: Supabase Service Role Key (Admin Auth API)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (serviceRoleKey && supabaseUrl) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const targetUser = usersData.users.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );

        if (!targetUser) {
          return NextResponse.json(
            { error: 'No account found with this email address.' },
            { status: 404 }
          );
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUser.id,
          { password: newPassword }
        );

        if (updateError) throw updateError;

        return NextResponse.json({
          success: true,
          message: 'Password reset successfully.',
        });
      } catch (adminErr: unknown) {
        console.error('Admin password reset failed:', adminErr);
        // If admin failed, attempt RPC fallback
      }
    }

    // Strategy 2: PostgreSQL RPC function 'reset_password_direct'
    if (supabase) {
      const { data, error } = await supabase.rpc('reset_password_direct', {
        target_email: cleanEmail,
        new_password: newPassword,
      });

      if (!error && data) {
        const result = typeof data === 'string' ? JSON.parse(data) : data;
        if (result.success) {
          return NextResponse.json({
            success: true,
            message: result.message || 'Password reset successfully.',
          });
        } else {
          return NextResponse.json(
            { error: result.message || 'Failed to reset password.' },
            { status: 400 }
          );
        }
      }

      if (error) {
        // Function not installed in Supabase
        if (error.code === 'PGRST202' || error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
          return NextResponse.json(
            {
              error:
                'Direct password reset function is not installed in your Supabase project. Run the SQL script from supabase/schema.sql in your Supabase SQL editor, or set SUPABASE_SERVICE_ROLE_KEY in .env.local.',
            },
            { status: 501 }
          );
        }

        return NextResponse.json(
          { error: error.message || 'Database error occurred during reset.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          'Supabase credentials are not configured or direct reset function is missing.',
      },
      { status: 500 }
    );
  } catch (err: unknown) {
    console.error('Reset password API error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
