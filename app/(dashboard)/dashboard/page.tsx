"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client";
import React, { useEffect, useState } from "react";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
      const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
  
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email)
            .single()
  
          if (error) {
            console.error('Error fetching user data:', error)
          } else {
            setUserData(data)
          }
        }
      }
  
      fetchUser()
    }, [])

      return (
        <div>
          <h1>User Profile</h1>
          {userData ? (
            <div>
              <p>Email: {userData.full_name}</p>
              {/* Add more fields as needed */}
            </div>
          ) : (
            <p>Loading user data...</p>
          )}
        </div>
      )
    }