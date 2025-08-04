import { Client } from "@prisma/client";
import prisma from "../../../shared/prisma";

const createClientIntoDB = async (payload: Client, id: string) => {

    const result = await prisma.client.create({ data: { name: payload.name, userId: id, calculatorId: payload.calculatorId } })
    return result
};

const getClientsFromDB = async (id: string) => {
    const result = await prisma.client.findMany({
        where: {
            userId: id
        },
        include: {
            calculator: true
        }
    })
    return result
}
export const ClientServices = {
    createClientIntoDB,
    getClientsFromDB
}