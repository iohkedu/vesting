import {
    applyCborEncoding, BlockfrostProvider, Data, deserializeAddress, MeshTxBuilder, MeshWallet, PlutusScript,
    serializePlutusScript,
    SLOT_CONFIG_NETWORK,
    unixTimeToEnclosingSlot,
    UTxO,
} from "@meshsdk/core";

///////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// CONSTANT VALUES ///////////////////////////////////////

const vestingScript: PlutusScript = {
    code: applyCborEncoding('5901c801010029800aba2aba1aab9faab9eaab9dab9cab9a488888896600264653001300800198041804800cc0200092225980099b8748008c020dd500144c8cc894cc02924115706c616365686f6c6465722076616c696461746f720015980099b8748000c02cdd5000c4c966002b3001325980099b8748008c034dd5000c4cdc49bad3010300e37540046eb4c040c038dd5000c5282016300f300d3754601e601a6ea8c03cc040c040c040c040c040c040c040c034dd5002c528c54cc02d24011869735f706173745f646561646c696e65203f2046616c73650014a080522b3001323322330020020012259800800c528456600266e3cdd71809000801c528c4cc008008c04c00500d20223758602060226022602260226022602260226022601c6ea8018dd71807980818069baa0018a518a99805a4812069735f7369676e65645f62795f62656e6566696369617279203f2046616c73650014a08052294100a180718061baa0018a998052491765787065637420536f6d6528766429203d20646174756d0016402460180026018601a00260126ea800a2c8030601000260086ea8022293454cc00924011856616c696461746f722072657475726e65642066616c7365001365640041'),
    version: 'V3',
};

const { address: scriptAddr } = serializePlutusScript(vestingScript);

//////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// HELPER FUNCTIONS ///////////////////////////////////////

const blockchainProvider = new BlockfrostProvider(process.env.BLOCKFROST_API_KEY || "");

const backendWallet = (user_address: string) => new MeshWallet({
    networkId: 0, // All testnet networks.
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "address",
        address: user_address,
    },
});

// Prepare the datum for the vesting script
const getDatum = (beneficiary_addr: string, deadline: string): Data => {
    const dateObject = new Date(deadline);
    const posixTime = dateObject.getTime();
    const { pubKeyHash } = deserializeAddress(beneficiary_addr)
    const datum: Data = { alternative: 0, fields: [posixTime, pubKeyHash] };
    console.log("Datum: ", datum);
    return datum;
}

//////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////// MAIN FUNCTIONS ////////////////////////////////////////

export const lockAdaInScript = async (
    user_addr: string,
    beneficiary_addr: string,
    amount: number,
    deadline: string
): Promise<string | null> => {
    try {
        const txBuilder = new MeshTxBuilder({ fetcher: blockchainProvider, submitter: blockchainProvider })

        const unsignedTx = await txBuilder
            .setNetwork("preview")
            .txOut(scriptAddr, [{ unit: 'lovelace', quantity: (amount * 1_000_000).toString() }])
            .txOutInlineDatumValue(getDatum(beneficiary_addr, deadline))
            .changeAddress(user_addr)
            .selectUtxosFrom(await blockchainProvider.fetchAddressUTxOs(user_addr))
            .complete()

        console.log(`txHash:\n ${unsignedTx}`);
        return unsignedTx;
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
        const txBuilder = new MeshTxBuilder({
            fetcher: blockchainProvider,
            submitter: blockchainProvider,
        })

        const collateral: UTxO = (await backendWallet(beneficiary_addr).getCollateral())[0]!;

        const { pubKeyHash } = deserializeAddress(beneficiary_addr);

        const invalidBefore =
            unixTimeToEnclosingSlot(
                Date.now() - 30000, // 30 seconds before the current time to account for network latency
                SLOT_CONFIG_NETWORK.preview
            ) + 1;

        const unsignedTx = await txBuilder
            .setNetwork("preview")
            .spendingPlutusScriptV3()
            .txIn(tx_hash, tx_ix)
            .txInInlineDatumPresent()
            .txInRedeemerValue("")
            .txInScript(vestingScript.code)
            .selectUtxosFrom(await blockchainProvider.fetchAddressUTxOs(beneficiary_addr))
            .changeAddress(beneficiary_addr)
            .txInCollateral(
                collateral.input.txHash,
                collateral.input.outputIndex,
                collateral.output.amount,
                collateral.output.address,
            )
            .invalidBefore(invalidBefore)
            .requiredSignerHash(pubKeyHash)
            .complete()

        console.log(`txHash:\n ${unsignedTx}`);
        return unsignedTx;
    } catch (error) {
        console.error("Error unlocking ada from script: ", error);
        return null;
    }
}
