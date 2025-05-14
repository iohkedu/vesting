
export const lockAdaInScript = async (
    user_addr: string,
    beneficiary_addr: string,
    amount: number,
    deadline: string
): Promise<string | null> => {
    try {
        return JSON.stringify({ user_addr, beneficiary_addr, amount, deadline }); //TODO: replace with actual implementation
    } catch (error) {
        console.error("Error locking ada in script: ", error);
        return null;
    }
}

export const unlockAdaFromScript = async (
    beneficiary_addr: string,
    tx_hash: string,
    tx_ix: number
): Promise<string | null> => {
    try {
        return JSON.stringify({ beneficiary_addr, tx_hash, tx_ix }); //TODO: replace with actual implementation
    } catch (error) {
        console.error("Error unlocking ada from script: ", error);
        return null;
    }
}
