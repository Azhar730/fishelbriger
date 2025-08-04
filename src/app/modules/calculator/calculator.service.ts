import { Calculator } from "@prisma/client";
import prisma from "../../../shared/prisma";

const createOrUpdateCalculatorIntoDB = async (payload: Calculator, id: string) => {
    const { clientId, purchasePrice, loanAmount, downPayment, ltvPercent, mortgageType } = payload

    let finalLoanAmount = loanAmount
    let finalDownPayment = downPayment
    let finalLtvPercent = ltvPercent

    // case-1: if just loan amount
    if (loanAmount && !ltvPercent && !downPayment) {
        finalLtvPercent = (loanAmount / purchasePrice!) * 100
        finalDownPayment = purchasePrice! - loanAmount
    }

    // case-2: if just ltv percent
    else if (!loanAmount && ltvPercent && !downPayment) {
        finalLoanAmount = (ltvPercent / 100) * purchasePrice!
        finalDownPayment = purchasePrice! - finalLoanAmount
    }

    // case-3: if just down payment
    else if (!loanAmount && !ltvPercent && downPayment) {
        finalLoanAmount = purchasePrice! - downPayment;
        finalLtvPercent = (finalLoanAmount / purchasePrice!) * 100;
    }
    // update or create logic
    const existingCalculator = await prisma.calculator.findFirst({
        where: {
            clientId
        }
    })
    if (existingCalculator) {
        // Update
        return prisma.calculator.update({
            where: {
                id: existingCalculator.id
            },
            data: {
                purchasePrice,
                loanAmount: finalLoanAmount,
                downPayment: finalDownPayment,
                ltvPercent: finalLtvPercent,
                mortgageType
            }
        })
    } else {
        // Create
        return prisma.calculator.create({
            data: {
                clientId,
                purchasePrice,
                loanAmount: finalLoanAmount,
                downPayment: finalDownPayment,
                ltvPercent: finalLtvPercent,
                mortgageType

            }
        })
    }
}

export const CalculatorServices = {
    createOrUpdateCalculatorIntoDB
}