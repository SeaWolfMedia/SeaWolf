import { useState } from 'react';
import { Avatar, Button, Card, Center, Container, Group, ScrollArea, SimpleGrid, Stack, Stepper, Title } from '@mantine/core';
import { getProviders } from "next-auth/react";
import { Adjustments, UserCheck, MailOpened, ShieldCheck, CircleCheck, Folder, User, Certificate } from 'tabler-icons-react';
import { StepOne, StepTwo } from '../components/setup/steps';

export default function setup() {
    const [active, setActive] = useState(0);

    return (
        <Center className="w-screen h-screen bg-sky-600">
            <Center className="w-10/12 h-5/6">
                <Card className="w-full h-full">
                    <div className="flex justify-around space-x-4 h-full">
                        <div className="relative h-full">
                            <Stack justify="space-around" className="grow-0 h-max space-y-5">
                                <Center>
                                    <Title align="center">Setup SeaWolf</Title>
                                </Center>
                                <Center>
                                    <ScrollArea>
                                        <Stepper active={active} completedIcon={<CircleCheck />} orientation="vertical">
                                            <Stepper.Step icon={<User size={18} />} label="Step 1" description="Create an account" />
                                            <Stepper.Step icon={<Adjustments size={18} />} label="Step 2" description="Basic configuration" />
                                            <Stepper.Step icon={<Folder size={18} />} label="Step 3" description="Import content" />
                                            <Stepper.Step icon={<Certificate size={18} />} label="Review" description="Review SeaWolf setup" />
                                        </Stepper>
                                    </ScrollArea>
                                </Center>
                            </Stack>
                            <Group position="center" className="absolute inset-x-0 bottom-0">
                                {active > 0 ? <Button className="bg-sky-600 text-white hover:text-black hover:bg-red-800" onClick={() => { setActive(active - 1) }}>
                                    Back
                                </Button> : null}
                                {active < 4 ? <Button className="bg-sky-600 text-white hover:text-black hover:bg-green-800" onClick={() => { setActive(active + 1) }}>
                                    {active == 3 ? "Finish" : (active == 2 ? "Review" : "Next")}
                                </Button> : null}
                            </Group>
                        </div>
                        <Card className="grow h-full bg-sky-600">
                            <Card className="h-full">
                                {renderStep(active)}
                            </Card>
                        </Card>
                    </div>
                </Card>
            </Center>
        </Center>
    );
}

function renderStep(step) {
    switch (step) {
        case 0:
            return <StepOne/>;
        case 1:
            return <StepTwo />;
        default:
            return <></>;
    }
}