import { Button, Center, Code, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { useSession, signIn, signOut } from "next-auth/react"

export function StepOne(){
    const { data: session } = useSession()
    return (
        <>
            <Center>
                <Stack align="center" spacing="xs">
                    <Title align="center">Create Account</Title>
                    <Text align="center">Create a profile to be the owner of this SeaWolf instance</Text>
                </Stack>
            </Center>
            <Center className="w-full">
                <Grid justify="center">
                    <Grid.Col>
                        {console.log(session)}
                        <Button className={session ? "bg-green-700 hover:bg-green-800" : "bg-red-700 hover:bg-red-800"} onClick={() => {
                            if(session){
                                signOut();
                            } else {
                                signIn("discord");
                            }
                        }}>{session ? "Linked to Discord" : "Sign in with Discord"}</Button>
                    </Grid.Col>
                </Grid>
            </Center>
        </>
    );
}

export function StepTwo(){
    return (
        <Title>Step 2</Title>
    )
}