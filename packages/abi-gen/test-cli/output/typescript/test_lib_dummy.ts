// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma enum-naming
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import {
    AwaitTransactionSuccessOpts,
    ContractFunctionObj,
    ContractTxFunctionObj,
    SendTransactionOpts,
    BaseContract,
    PromiseWithTransactionHash,
    methodAbiToFunctionSignature,
} from '@0x/base-contract';
import { schemas } from '@0x/json-schemas';
import {
    BlockParam,
    BlockParamLiteral,
    BlockRange,
    CallData,
    ContractAbi,
    ContractArtifact,
    DecodedLogArgs,
    MethodAbi,
    TransactionReceiptWithDecodedLogs,
    TxData,
    TxDataPayable,
    SupportedProvider,
} from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class TestLibDummyContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode =
        '0x6080604052348015600f57600080fd5b506004361060325760003560e01c806322935e921460375780632b82fdf0146063575b600080fd5b605160048036036020811015604b57600080fd5b5035607d565b60408051918252519081900360200190f35b605160048036036020811015607757600080fd5b5035608c565b60006086826095565b92915050565b6000608682609c565b6104d20190565b6001019056fea265627a7a72315820863e53f0da474a1275d583d88852313fe053941e79bddd5279abd812b31e020c64736f6c634300050c0032';
    private readonly _methodABIIndex: { [name: string]: number } = {};
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<TestLibDummyContract> {
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        if (artifact.compilerOutput === undefined) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        const logDecodeDependenciesAbiOnly: { [contractName: string]: ContractAbi } = {};
        if (Object.keys(logDecodeDependencies) !== undefined) {
            for (const key of Object.keys(logDecodeDependencies)) {
                logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
            }
        }
        return TestLibDummyContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<TestLibDummyContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(constructorAbi.inputs, [], BaseContract._bigNumberToString);
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, []);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`TestLibDummy successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new TestLibDummyContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [];
        return contractInstance;
    }

    /**
     * @returns      The contract ABI
     */
    public static ABI(): ContractAbi {
        const abi = [
            {
                constant: true,
                inputs: [
                    {
                        name: 'x',
                        type: 'uint256',
                    },
                ],
                name: 'publicAddConstant',
                outputs: [
                    {
                        name: 'result',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'x',
                        type: 'uint256',
                    },
                ],
                name: 'publicAddOne',
                outputs: [
                    {
                        name: 'result',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
        ] as ContractAbi;
        return abi;
    }

    public getFunctionSignature(methodName: string): string {
        const index = this._methodABIIndex[methodName];
        const methodAbi = TestLibDummyContract.ABI()[index] as MethodAbi; // tslint:disable-line:no-unnecessary-type-assertion
        const functionSignature = methodAbiToFunctionSignature(methodAbi);
        return functionSignature;
    }
    public getABIDecodedTransactionData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as TestLibDummyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecode<T>(callData);
        return abiDecodedCallData;
    }
    public getABIDecodedReturnData<T>(methodName: string, callData: string): T {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as TestLibDummyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        const abiDecodedCallData = abiEncoder.strictDecodeReturnValue<T>(callData);
        return abiDecodedCallData;
    }
    public getSelector(methodName: string): string {
        const functionSignature = this.getFunctionSignature(methodName);
        const self = (this as any) as TestLibDummyContract;
        const abiEncoder = self._lookupAbiEncoder(functionSignature);
        return abiEncoder.getSelector();
    }

    public publicAddConstant(x: BigNumber): ContractFunctionObj<BigNumber> {
        const self = (this as any) as TestLibDummyContract;
        assert.isBigNumber('x', x);

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('publicAddConstant(uint256)', [x]);
                let rawCallResult;

                const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');
                try {
                    rawCallResult = await self._evmExecAsync(encodedDataBytes);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('publicAddConstant(uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('publicAddConstant(uint256)', [x]);
                return abiEncodedTransactionData;
            },
        };
    }
    public publicAddOne(x: BigNumber): ContractFunctionObj<BigNumber> {
        const self = (this as any) as TestLibDummyContract;
        assert.isBigNumber('x', x);

        return {
            async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
                assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                    schemas.addressSchema,
                    schemas.numberSchema,
                    schemas.jsNumber,
                ]);
                if (defaultBlock !== undefined) {
                    assert.isBlockParam('defaultBlock', defaultBlock);
                }
                const encodedData = self._strictEncodeArguments('publicAddOne(uint256)', [x]);
                let rawCallResult;

                const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');
                try {
                    rawCallResult = await self._evmExecAsync(encodedDataBytes);
                } catch (err) {
                    BaseContract._throwIfThrownErrorIsRevertError(err);
                    throw err;
                }

                BaseContract._throwIfCallResultIsRevertError(rawCallResult);
                const abiEncoder = self._lookupAbiEncoder('publicAddOne(uint256)');
                // tslint:disable boolean-naming
                const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
                // tslint:enable boolean-naming
                return result;
            },
            getABIEncodedTransactionData(): string {
                const abiEncodedTransactionData = self._strictEncodeArguments('publicAddOne(uint256)', [x]);
                return abiEncodedTransactionData;
            },
        };
    }

    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = TestLibDummyContract.deployedBytecode,
    ) {
        super(
            'TestLibDummy',
            TestLibDummyContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        TestLibDummyContract.ABI().forEach((item, index) => {
            if (item.type === 'function') {
                const methodAbi = item as MethodAbi;
                this._methodABIIndex[methodAbi.name] = index;
            }
        });
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
