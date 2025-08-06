
import { PrimaryCalculator } from "@prisma/client";
import prisma from "../../../shared/prisma";

const createOrUpdateCalculatorIntoDB = async (payload: PrimaryCalculator, id: string) => {
    const {
    purchasePrice,
    loanToValuePercent,
    downPayment,
    loanAmount,
    rateParcent,
    termInYears,
    closingCost,
    taxAndInsurance,
    pmi,
    hoaFees
  } = payload

  // Bidirectional calculations
  let finalLoanAmount = loanAmount
  let finalDownPayment = downPayment
  let finalLTVPercent = loanToValuePercent

  // 1. Calculate loanAmount if not given
  if (!finalLoanAmount && finalLTVPercent !== undefined) {
    finalLoanAmount = (finalLTVPercent / 100) * purchasePrice
  } else if (!finalLoanAmount && finalDownPayment !== undefined) {
    finalLoanAmount = purchasePrice - finalDownPayment
  }

  // 2. Calculate downPayment if not given
  if (!finalDownPayment && finalLoanAmount !== undefined) {
    finalDownPayment = purchasePrice - finalLoanAmount
  }

  // 3. Calculate LTV% if not given
  if (!finalLTVPercent && finalLoanAmount !== undefined) {
    finalLTVPercent = (finalLoanAmount / purchasePrice) * 100
  }

  // 4. Calculate Mortgage Payment using loanAmount and rate
  const monthlyRate = rateParcent / 100 / 12
  const totalPayments = termInYears * 12

  let mortgagePayment = 0
  if (finalLoanAmount) {
    const power = Math.pow(1 + monthlyRate, totalPayments)
    mortgagePayment = Math.round(
      finalLoanAmount * ((monthlyRate * power) / (power - 1))
    )
  }

  // 5. Calculate total monthly payment
  const totalMonthlyPayment =
    mortgagePayment + taxAndInsurance + pmi + hoaFees

  return {
    purchasePrice,
    loanToValuePercent: finalLTVPercent,
    downPayment: finalDownPayment,
    loanAmount: finalLoanAmount,
    rateParcent,
    closingCost,
    mortgagePayment,
    taxAndInsurance,
    pmi,
    hoaFees,
    totalMonthlyPayment
  }
}

export const CalculatorServices = {
    createOrUpdateCalculatorIntoDB
}