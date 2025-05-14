import { NextApiRequest, NextApiResponse } from 'next';
import { unlockAdaFromScript } from '@/off-chain';

interface ConsumeVestingRequest {
    utxoRef: string;
    utxoIndex: number;
    address: string;
}

interface ConsumeVestingResponse {
    success: boolean;
    balancedTx?: string;
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ConsumeVestingResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { utxoRef, utxoIndex, address } = req.body as ConsumeVestingRequest;

        if (!utxoRef || utxoIndex === undefined || !address) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: utxoRef, utxoIndex, address, or deadline'
            });
        }

        const balancedTx = await unlockAdaFromScript(
            address,  // beneficiary_addr (same as user in this case)
            utxoRef,
            utxoIndex
        );

        if (!balancedTx) {
            return res.status(400).json({
                success: false,
                error: 'Failed to create balanced transaction'
            });
        }

        return res.status(200).json({
            success: true,
            balancedTx
        });

    } catch (error) {
        console.error('Error in consume-vesting:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
    }
} 
