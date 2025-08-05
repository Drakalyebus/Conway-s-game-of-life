// export const rules = {
//     "types": [0, 1],
//     "kernels": {
//         "moore": [
//             [1, 1, 1],
//             [1, 0, 1],
//             [1, 1, 1]
//         ]
//     },
//     "default": {
//         "kernel": "moore"
//     },
//     "behavior": [
//         {
//             "from": [0],
//             "condition": {
//                 "value": [1],
//                 "sign": "=",
//                 "count": 3,
//                 "kernel": "moore"
//             },
//             "elseTo": 0,
//             "to": 1
//         },
//         {
//             "from": [1],
//             "condition": {
//                 "or": [
//                     {
//                         "value": [1],
//                         "sign": "<",
//                         "count": 2,
//                         "kernel": "moore"
//                     },
//                     {
//                         "value": [1],
//                         "sign": ">",
//                         "count": 3,
//                         "kernel": "moore"
//                     }
//                 ]
//             },
//             "elseTo": 1,
//             "to": 0
//         }
//     ]
// };

export const rules = {
    "types": [0, 1, 2],
    "kernels": {
        "vonNeumann": [
            [0, 1, 0],
            [1, 0, 1],
            [0, 1, 0]
        ]
    },
    "default": {
        "kernel": "vonNeumann"
    },
    "behavior": [
        {
            "from": [0],
            "condition": {
                "expression": "random()",
                "sign": "<",
                "value": 0.15
            },
            "to": 1
        },
        {
            "from": [1],
            "condition": {
                "or": [
                    {
                        "value": [2],
                        "sign": ">",
                        "count": 0,
                        "kernel": "vonNeumann"
                    },
                    {
                        "expression": "random()",
                        "sign": "<",
                        "value": 0
                    }
                ]
            },
            "to": 2
        },
        {
            "from": [2],
            "to": 0
        }
    ]
};