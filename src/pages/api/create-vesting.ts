import { lockAdaInScript } from '@/off-chain';
import type { NextApiRequest, NextApiResponse } from 'next';

type CreateVestingRequest = {
    address: string;
    adaAmount: string;
    beneficiary: string;
    deadline: string;
};

export type CreateVestingResponse = {
    success: boolean;
    balancedTx?: string;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<CreateVestingResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { address, beneficiary, adaAmount, deadline } = req.body as CreateVestingRequest;

        console.log('Creating vesting UTxO with:', { address, adaAmount, beneficiary, deadline });

        const balancedTx = await lockAdaInScript(address, beneficiary, Number(adaAmount), deadline);

        if (!balancedTx) {
            return res.status(500).json({
                success: false,
                error: 'Failed to create vesting UTxO'
            });
        }

        return res.status(200).json({
            success: true,
            balancedTx
        });
    } catch (error) {
        console.error('Error creating vesting UTxO:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create vesting UTxO'
        });
    }
} 
