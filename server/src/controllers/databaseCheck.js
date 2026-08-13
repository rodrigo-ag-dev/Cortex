const databaseCheck = async ({ database, redisClient }) => {
  const resp = await redisClient.get('database')
  let lifeCycle = 0
  if (resp) {
    database = JSON.parse(resp)
    if (database[0].dateCache) {
      lifeCycle = Math.abs(new Date() - new Date(database[0].dateCache))
      lifeCycle = lifeCycle / (1000 * 60 * 60 * 24)
      if (lifeCycle >= 7)
        database[0].dateCache = null
    }
    return database
  }
}

export default databaseCheck