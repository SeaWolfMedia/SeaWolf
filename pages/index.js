import { Button, Card, Center, Title } from '@mantine/core';
import { useSession, signIn, signOut } from "next-auth/react"

import { authOptions } from './api/auth/[...nextauth]'
import { unstable_getServerSession } from "next-auth/next"

export async function getServerSideProps(context) {
  const session = await unstable_getServerSession(context.req, context.res, authOptions)

  // if (!session) {
  //   return {
  //     redirect: {
  //       destination: '/setup',
  //       permanent: false,
  //     },
  //   }
  // }

  return {
    props: {
      session,
    },
  }
}

export default function Home() {
  return (
    <Center className="w-screen h-screen bg-sky-600">
      <Center className="w-4/5 h-4/5">
        <Card className="w-full h-full">
          <Title>SeaWolf</Title>
        </Card>
      </Center>
    </Center>
  )
}