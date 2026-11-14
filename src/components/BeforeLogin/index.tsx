import React from 'react'

import { LoginCode } from '@/components/admin/TwoFactor/LoginCode.client'

const BeforeLogin: React.FC = () => {
  return (
    <div>
      <p>
        <b>Welcome to UltimaPress.</b> Log in to manage your website.
      </p>
      <LoginCode />
    </div>
  )
}

export default BeforeLogin
