import { getServerSession } from 'next-auth'
import React from 'react'
import authOptions from '../../api/auth/authOptions';

const Dashboard = async () => {
  const session = await getServerSession(authOptions);

  return (
    <div>
      {
        JSON.stringify(session)
      }
    </div>
  )
}

export default Dashboard