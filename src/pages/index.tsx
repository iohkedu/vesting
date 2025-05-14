import Head from "next/head";
import { CardanoWallet, useWallet } from "@meshsdk/react";
import { useState } from "react";
import { CreateVestingResponse } from "./api/create-vesting";

export default function Home() {
    const [adaAmount, setAdaAmount] = useState("");
    const [beneficiary, setBeneficiary] = useState("");
    const [utxoRef, setUtxoRef] = useState("");
    const [utxoIndex, setUtxoIndex] = useState("");
    const [deadline, setDeadline] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { wallet, connected } = useWallet();

    const handleCreateVesting = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/create-vesting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address: await wallet.getChangeAddress(), beneficiary, adaAmount, deadline }),
            });

            const data = await response.json() as CreateVestingResponse;

            if (!data.success || !data.balancedTx) {
                throw new Error(data.error || 'Failed to create vesting UTxO');
            }

            const signedTx = await wallet.signTx(data.balancedTx, true);
            const txHash = await wallet.submitTx(signedTx);

            setSuccess(`Vesting UTxO created successfully! Tx hash: ${txHash}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    const handleConsumeVesting = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/consume-vesting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    utxoRef,
                    utxoIndex: parseInt(utxoIndex),
                    address: await wallet.getChangeAddress(),
                    deadline
                }),
            });

            const data = await response.json();

            if (!data.success || !data.balancedTx) {
                throw new Error(data.error || 'Failed to consume vesting UTxO');
            }

            const signedTx = await wallet.signTx(data.balancedTx, true);
            const txHash = await wallet.submitTx(signedTx);

            setSuccess(`Vesting UTxO consumed successfully! Tx hash: ${txHash}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    return (
        <div className="bg-gray-900 w-full text-white text-center">
            <Head>
                <title>Vesting DApp</title>
                <meta name="description" content="A Cardano vesting dApp powered by Mesh" />
            </Head>
            <main className="flex min-h-screen flex-col items-center justify-center p-24">
                <h1 className="text-6xl font-thin mb-20">
                    <a href="https://meshjs.dev/" className="text-sky-600">
                        Vesting
                    </a>{" "}
                    DApp
                </h1>

                <div className="mb-20">
                    <CardanoWallet isDark={true} />
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-500 text-white rounded-lg">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="mb-4 p-4 bg-green-500 text-white rounded-lg">
                        {success}
                    </div>
                ) : (<div className="h-12"></div>)
                }

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                    {/* Create Vesting UTxO Section */}
                    <div className="bg-gray-800 rounded-xl border border-white p-6">
                        <h2 className="text-2xl font-bold mb-6">Create Vesting UTxO</h2>
                        <form onSubmit={handleCreateVesting} className="space-y-4">
                            <div className="text-left">
                                <label htmlFor="adaAmount" className="block mb-2">
                                    ADA to lock
                                </label>
                                <input
                                    type="number"
                                    id="adaAmount"
                                    value={adaAmount}
                                    onChange={(e) => setAdaAmount(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                                    placeholder="Enter ADA amount"
                                    required
                                />
                            </div>
                            <div className="text-left">
                                <label htmlFor="beneficiary" className="block mb-2">
                                    Beneficiary
                                </label>
                                <input
                                    type="text"
                                    id="beneficiary"
                                    value={beneficiary}
                                    onChange={(e) => setBeneficiary(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                                    placeholder="Enter beneficiary address"
                                    required
                                />
                            </div>
                            <div className="text-left">
                                <label htmlFor="deadline" className="block mb-2">
                                    Vesting Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    id="deadline"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!connected}
                            >
                                Create Vesting UTxO
                            </button>
                        </form>
                    </div>

                    {/* Consume Vesting UTxO Section */}
                    <div className="bg-gray-800 rounded-xl border border-white p-6">
                        <h2 className="text-2xl font-bold mb-6">Consuming Vesting UTxO</h2>
                        <form onSubmit={handleConsumeVesting} className="space-y-4">
                            <div className="text-left">
                                <label htmlFor="utxoRef" className="block mb-2">
                                    UTxO Reference
                                </label>
                                <input
                                    type="text"
                                    id="utxoRef"
                                    value={utxoRef}
                                    onChange={(e) => setUtxoRef(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                                    placeholder="Enter UTxO reference"
                                    required
                                />
                            </div>
                            <div className="text-left">
                                <label htmlFor="utxoIndex" className="block mb-2">
                                    UTxO Index
                                </label>
                                <input
                                    type="number"
                                    id="utxoIndex"
                                    value={utxoIndex}
                                    onChange={(e) => setUtxoIndex(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                                    placeholder="Enter UTxO index"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!connected}
                            >
                                Consume Vesting UTxO
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
