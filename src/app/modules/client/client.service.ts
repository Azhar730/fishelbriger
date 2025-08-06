import { Client, PrismaClient } from "@prisma/client";
import { IGenericResponse } from "../../../interfaces/common";
import QueryBuilder from "../../../helpars/queryBuilder";
import { ClientSearchableFields } from "./client.constant";


const prisma = new PrismaClient()
const createClientIntoDB = async (payload: Client) => {
    const result = await prisma.client.create({ data: payload })
    return result
};

const getClientsFromDB = async (query: Record<string, any>): Promise<IGenericResponse<Client[]>> => {
    const queryBuilder = new QueryBuilder(prisma.client, query)
    const clients = await queryBuilder.range().search(ClientSearchableFields).filter().sort().paginate().fields().execute()
    const meta = await queryBuilder.countTotal()
    return { meta, data: clients }
}
export const ClientServices = {
    createClientIntoDB,
    getClientsFromDB
}