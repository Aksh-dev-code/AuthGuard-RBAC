import React from 'react'
import { NavLink } from 'react-router-dom'

const Header = ()=>{
    return(
        <header className='bg-gray-800 text-white p4 flex space-x-6'>
            <NavLink to = "/"
            end 
            className = {({isActive}) =>
                isActive
                    'text-yellow-400 font-semibol'
                    'hover:text-yellow-300 transition-colors'
            }
            >
              Home 
            </NavLink>
            <NavLink to = "/login"
            className={({isActive})}></NavLink>
        </>
    )
}

export default Header