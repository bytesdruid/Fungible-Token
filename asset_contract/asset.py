from pyteal import *

# 121962350 APP ID

def approval():
    on_creation = Seq(
        [
            # g byteslice - asset name is Bloom Token
            App.globalPut(Bytes("AssetName"), Bytes("Bloom Token")),
            # g byteslice - unit name is BLT
            App.globalPut(Bytes("UnitName"), Bytes("BLT")),
            # g int - decimals
            App.globalPut(Bytes("Decimals"), Int(2)),
            # g Int - total supply 
            App.globalPut(Bytes("Total"), Int(100000000)),
            # g Int - reserve is total amount not sitting in local balance
            App.globalPut(Bytes("GlobalReserve"), Int(100000000)),
            # approve sequence
            Return(Int(1)),
        ]
    )

    opt_in = Seq([
        # l int - local balance
        App.localPut(Int(0), Bytes("LocalBalance"), Int(0)),
        Return(Int(1))
    ])

    init_admin = Seq([
        # make sure account opting in is the contract creator address
        Assert(Txn.sender() == Global.creator_address()),
        # set the txn sender address to manager
        App.localPut(Int(0), Bytes("Admin"), Int(1)),
        Return(Int(1))
    ])

    is_admin = App.localGet(Int(0), Bytes("Admin"))

    set_admin = Seq(
        [
            Assert(And(is_admin, Txn.application_args.length() == Int(1))),
            App.localPut(Int(1), Bytes("Admin"), Int(1)),
            Return(Int(1)),
        ]
    )

    on_closeout = Seq(
        [
            App.globalPut(
                Bytes("GlobalReserve"),
                App.globalGet(Bytes("GlobalReserve"))
                + App.localGet(Int(0), Bytes("LocalBalance")),
            ),
            Return(Int(1)),
        ]
    )

    mint = Seq(
        [
            Assert(Txn.application_args.length() == Int(2)),
            Assert(Btoi(Txn.application_args[1]) <= App.globalGet(Bytes("GlobalReserve"))),
            App.globalPut(
                Bytes("GlobalReserve"), App.globalGet(Bytes("GlobalReserve")) - Btoi(Txn.application_args[1]),
            ),
            App.localPut(
                Int(0),
                Bytes("LocalBalance"),
                App.localGet(Int(0), Bytes("LocalBalance")) + Btoi(Txn.application_args[1]),
            ),
            Return(is_admin),
        ]
    )

    transfer_amount = Btoi(Txn.application_args[1])    
    transfer = Seq(
        [
            Assert(Txn.application_args.length() == Int(2)),
            Assert(transfer_amount <= App.localGet(Int(0), Bytes("LocalBalance"))),
            App.localPut(
                Int(0),
                Bytes("LocalBalance"),
                App.localGet(Int(0), Bytes("LocalBalance")) - transfer_amount,
            ),
            App.localPut(
                Int(1),                 
                Bytes("LocalBalance"),
                App.localGet(Int(1), Bytes("LocalBalance")) + transfer_amount,
            ),
            Return(Int(1)),
        ]
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_admin)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_admin)],
        [Txn.on_completion() == OnComplete.CloseOut, on_closeout],
        [Txn.on_completion() == OnComplete.OptIn, opt_in],
        [Txn.application_args[0] == Bytes("Init_Admin"), init_admin],
        [Txn.application_args[0] == Bytes("Set_Admin"), set_admin],
        [Txn.application_args[0] == Bytes("Mint"), mint],
        [Txn.application_args[0] == Bytes("Transfer"), transfer],
    )

    return program

def clear():
    program = Seq(
        [
            App.globalPut(
                Bytes("GlobalReserve"),
                App.globalGet(Bytes("GlobalReserve"))
                + App.localGet(Int(0), Bytes("LocalBalance")),
            ),
            Return(Int(1)),
        ]
    )

    return program


if __name__ == "__main__":
    with open("approval.teal", "w") as f:
        compiled = compileTeal(approval(), mode=Mode.Application, version=6)
        f.write(compiled)

    with open("clear.teal", "w") as f:
        compiled = compileTeal(clear(), mode=Mode.Application, version=6)
        f.write(compiled)