const successRes = (data) => {
    return {
        code: 200,
        status: "success",
        ...data
    }
}

const badRes = (data) => {
    return {
        code: 401,
        status: "fail",
        ...data
    }
}

export {
    successRes, badRes
}