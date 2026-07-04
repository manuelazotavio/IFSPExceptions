import { ExampleModel } from '../models/ExampleModel.js'
import { get } from '../services/api.js'

// Controller: orquestra Model e Service, expõe funções que a View consome
export async function fetchExamples() {
  const data = await get('/examples')
  return data.map((item) => new ExampleModel(item))
}
