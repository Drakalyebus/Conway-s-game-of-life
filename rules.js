export const rules = {
    "types": [0, 1],
    "kernels": {
        "moore": [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ]
    },
    "default": {
        "kernel": "moore"
    },
    "behavior": [
        {
            "from": [0],
            "neighborsAnd": [
                {
                    "value": [1],
                    "sign": "=",
                    "count": 3,
                    "kernel": "moore"
                }
            ],
            "boolean": "and",
            "elseTo": 0,
            "to": 1
        },
        {
            "from": [1],
            "neighborsOr": [
                {
                    "value": [1],
                    "sign": ">",
                    "count": 3,
                    "kernel": "moore"
                },
                {
                    "value": [1],
                    "sign": "<",
                    "count": 2,
                    "kernel": "moore"
                }
            ],
            "boolean": "and",
            "elseTo": 1,
            "to": 0
        }
    ]
};