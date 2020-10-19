export default {
  data: {
    status: 'SUCCESS',
    data: {
      content: [
        {
          name: 'pipeline1',
          identifier: 'pipeline1',
          description: 'pipeline1 description',
          numOfStages: 2,
          numOfErrors: 0,
          deployments: [1, 1, 0, 1, 3, 3, 2, 3, 2, 2]
        },
        {
          name: 'pipeline2',
          identifier: 'pipeline2',
          description: 'pipeline2 description',
          numOfStages: 2,
          numOfErrors: 2,
          deployments: [3, 4, 5, 4, 4, 1, 1, 2, 3, 2]
        }
      ],
      pageable: {
        sort: { sorted: false, unsorted: true, empty: true },
        pageSize: 25,
        offset: 0,
        pageNumber: 0,
        paged: true,
        unpaged: false
      },
      totalElements: 4,
      last: true,
      totalPages: 1,
      numberOfElements: 4,
      size: 25,
      number: 0,
      first: true,
      sort: { sorted: false, unsorted: true, empty: true },
      empty: false
    },
    correlationId: 'correlationId'
  },
  loading: false
}
