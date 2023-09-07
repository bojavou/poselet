import test from 'ava'
import Module from '#lib/loader/analyze/module.mjs'
import { BindingState } from '#lib/loader/analyze/enum.mjs'
import {
  Import, ImportRequest, NameBinding, NamedExport, WildcardExport
} from '#lib/loader/analyze/module/surface.mjs'

test('undefined default', t => {
  const entry = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './source.mjs',
      module: source,
      name: 'default'
    })
  }))
  t.throws(() => { entry.resolveExport('gadget') }, {
    instanceOf: SyntaxError,
    message: "The requested module './source.mjs'" +
      " does not provide an export named 'default'"
  })
})

test('undefined named', t => {
  const entry = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './source.mjs',
      module: source,
      name: 'gadget'
    })
  }))
  t.throws(() => { entry.resolveExport('gadget') }, {
    instanceOf: SyntaxError,
    message: "The requested module './source.mjs'" +
      " does not provide an export named 'gadget'"
  })
})

test('undefined named import', t => {
  const entry = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    import: new Import({
      name: 'gadget',
      request: new ImportRequest({
        specifier: './source.mjs',
        module: source,
        name: 'gadget'
      })
    })
  }))
  t.throws(() => { entry.resolveExport('gadget') }, {
    instanceOf: SyntaxError,
    message: "The requested module './source.mjs'" +
      " does not provide an export named 'gadget'"
  })
})

test('undefined named wildcard', t => {
  const entry = new Module()
  const aggregate = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './aggregate.mjs',
      module: aggregate,
      name: 'gadget'
    })
  }))
  aggregate.wildcards.add(new WildcardExport({
    request: new ImportRequest({
      specifier: './source.mjs',
      module: source
    })
  }))
  t.throws(() => { entry.resolveExport('gadget') }, {
    instanceOf: SyntaxError,
    message: "The requested module './aggregate.mjs'" +
      " does not provide an export named 'gadget'"
  })
})

test('cycle 0', t => {
  const entry = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './source.mjs',
      module: entry,
      name: 'gadget'
    })
  }))
  t.throws(() => { entry.resolveExport('gadget') }, {
    instanceOf: SyntaxError,
    message: "Detected cycle while resolving name 'gadget' in './source.mjs'"
  })
})

test('cycle 1', t => {
  const entry = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './source.mjs',
      module: source,
      name: 'gadget'
    })
  }))
  source.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './entry.mjs',
      module: entry,
      name: 'gadget'
    })
  }))
  t.throws(() => { entry.resolveExport('gadget') }, {
    instanceOf: SyntaxError,
    message: "Detected cycle while resolving name 'gadget' in './source.mjs'"
  })
})

test('cycle 1 import', t => {
  const entry = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './source.mjs',
      module: source,
      name: 'gadget'
    })
  }))
  source.exports.set('gadget', new NamedExport({
    name: 'gadget',
    import: new Import({
      name: 'gadget',
      request: new ImportRequest({
        specifier: './entry.mjs',
        module: entry,
        name: 'gadget'
      })
    })
  }))
  t.throws(() => { entry.resolveExport('gadget') }, {
    instanceOf: SyntaxError,
    message: "Detected cycle while resolving name 'gadget' in './source.mjs'"
  })
})

test('cycle wildcard', t => {
  const entry = new Module()
  const aggregate = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './aggregate.mjs',
      module: aggregate,
      name: 'gadget'
    })
  }))
  aggregate.wildcards.add(new WildcardExport({
    request: new ImportRequest({
      specifier: './source.mjs',
      module: source
    })
  }))
  source.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './entry.mjs',
      module: entry,
      name: 'gadget'
    })
  }))
  t.throws(() => { entry.resolveExport('gadget') }, {
    instanceOf: SyntaxError,
    message: "Detected cycle while resolving name 'gadget' in './source.mjs'"
  })
})

test('cycle wildcard override', t => {
  const entry = new Module()
  const relay = new Module()
  const aggregate = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './relay.mjs',
      module: relay,
      name: 'gadget'
    })
  }))
  relay.wildcards.add(new WildcardExport({
    request: new ImportRequest({
      specifier: './aggregate.mjs',
      module: aggregate
    })
  }))
  aggregate.wildcards
    .add(new WildcardExport({
      request: new ImportRequest({
        specifier: './relay.mjs',
        module: relay
      })
    }))
    .add(new WildcardExport({
      request: new ImportRequest({
        specifier: './source.mjs',
        module: source
      })
    }))
  const binding = new NameBinding({ module: source, name: 'gadget' })
  source.exports.set('gadget', new NamedExport({
    name: 'gadget',
    binding
  }))
  const result = entry.resolveExport('gadget')
  t.is(result, binding)
})

test('ambiguous', t => {
  const entry = new Module()
  const aggregate = new Module()
  const source1 = new Module()
  const source2 = new Module()
  entry.exports.set('value', new NamedExport({
    name: 'value',
    request: new ImportRequest({
      specifier: './aggregate.mjs',
      module: aggregate,
      name: 'value'
    })
  }))
  aggregate.wildcards
    .add(new WildcardExport({
      request: new ImportRequest({
        specifier: './source1.mjs',
        module: source1
      })
    }))
    .add(new WildcardExport({
      request: new ImportRequest({
        specifier: './source2.mjs',
        module: source2
      })
    }))
  source1.exports.set('value', new NamedExport({
    name: 'value',
    binding: new NameBinding({ module: source1, name: 'value' })
  }))
  source2.exports.set('value', new NamedExport({
    name: 'value',
    binding: new NameBinding({ module: source2, name: 'value' })
  }))
  const result = entry.resolveExport('value')
  t.is(result, BindingState.Ambiguous)
})

test('ambiguous propagate', t => {
  const entry = new Module()
  const aggregate1 = new Module()
  const aggregate2 = new Module()
  const source1 = new Module()
  const source2 = new Module()
  entry.exports.set('value', new NamedExport({
    name: 'value',
    request: new ImportRequest({
      specifier: './aggregate1.mjs',
      module: aggregate1,
      name: 'value'
    })
  }))
  aggregate1.wildcards.add(new WildcardExport({
    request: new ImportRequest({
      specifier: './aggregate2.mjs',
      module: aggregate2
    })
  }))
  aggregate2.wildcards
    .add(new WildcardExport({
      request: new ImportRequest({
        specifier: './source1.mjs',
        module: source1
      })
    }))
    .add(new WildcardExport({
      request: new ImportRequest({
        specifier: './source2.mjs',
        module: source2
      })
    }))
  source1.exports.set('value', new NamedExport({
    name: 'value',
    binding: new NameBinding({ module: source1, name: 'value' })
  }))
  source2.exports.set('value', new NamedExport({
    name: 'value',
    binding: new NameBinding({ module: source2, name: 'value' })
  }))
  const result = entry.resolveExport('value')
  t.is(result, BindingState.Ambiguous)
})

test('ambiguous default', t => {
  const entry = new Module()
  const aggregate = new Module()
  const source1 = new Module()
  const source2 = new Module()
  entry.exports.set('default', new NamedExport({
    name: 'default',
    request: new ImportRequest({
      specifier: './aggregate.mjs',
      module: aggregate,
      name: 'value'
    })
  }))
  aggregate.wildcards
    .add(new WildcardExport({
      request: new ImportRequest({
        specifier: './source1.mjs',
        module: source1
      })
    }))
    .add(new WildcardExport({
      request: new ImportRequest({
        specifier: './source2.mjs',
        module: source2
      })
    }))
  source1.exports.set('value', new NamedExport({
    name: 'value',
    binding: new NameBinding({ module: source1, name: 'value' })
  }))
  source2.exports.set('value', new NamedExport({
    name: 'value',
    binding: new NameBinding({ module: source2, name: 'value' })
  }))
  const result = entry.resolveExport('default')
  t.is(result, BindingState.Ambiguous)
})

test('direct', t => {
  const entry = new Module()
  const binding = new NameBinding({ module: entry, name: 'gadget' })
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    binding
  }))
  const result = entry.resolveExport('gadget')
  t.is(result, binding)
})

test('indirect', t => {
  const entry = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './source.mjs',
      module: source,
      name: 'gadget'
    })
  }))
  const binding = new NameBinding({ module: source, name: 'gadget' })
  source.exports.set('gadget', new NamedExport({
    name: 'gadget',
    binding
  }))
  const result = entry.resolveExport('gadget')
  t.is(result, binding)
})

test('indirect import', t => {
  const entry = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    import: new Import({
      name: 'gadget',
      request: new ImportRequest({
        specifier: './source.mjs',
        module: source,
        name: 'gadget'
      })
    })
  }))
  const binding = new NameBinding({ module: source, name: 'gadget' })
  source.exports.set('gadget', new NamedExport({
    name: 'gadget',
    binding
  }))
  const result = entry.resolveExport('gadget')
  t.is(result, binding)
})

test('wildcard', t => {
  const entry = new Module()
  const aggregate = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './aggregate.mjs',
      module: aggregate,
      name: 'gadget'
    })
  }))
  aggregate.wildcards.add(new WildcardExport({
    request: new ImportRequest({
      specifier: './source.mjs',
      module: source
    })
  }))
  const binding = new NameBinding({ module: source, name: 'gadget' })
  source.exports.set('gadget', new NamedExport({
    name: 'gadget',
    binding
  }))
  const result = entry.resolveExport('gadget')
  t.is(result, binding)
})

test('wildcard disambiguate', t => {
  const entry = new Module()
  const aggregate = new Module()
  const relay1 = new Module()
  const relay2 = new Module()
  const source = new Module()
  entry.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './aggregate.mjs',
      module: aggregate,
      name: 'gadget'
    })
  }))
  aggregate.wildcards
    .add(new WildcardExport({
      request: new ImportRequest({
        specifier: './relay1.mjs',
        module: relay1
      })
    }))
    .add(new WildcardExport({
      request: new ImportRequest({
        specifier: './relay2.mjs',
        module: relay2
      })
    }))
  relay1.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './source.mjs',
      module: source,
      name: 'gadget'
    })
  }))
  relay2.exports.set('gadget', new NamedExport({
    name: 'gadget',
    request: new ImportRequest({
      specifier: './source.mjs',
      module: source,
      name: 'gadget'
    })
  }))
  const binding = new NameBinding({ module: source, name: 'gadget' })
  source.exports.set('gadget', new NamedExport({
    name: 'gadget',
    binding
  }))
  const result = entry.resolveExport('gadget')
  t.is(result, binding)
})
