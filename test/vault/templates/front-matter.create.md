---
tags: {{tags}}
---

```js
const title = await tp.quickInput({ 
  placeholder: 'Input note\'s title'
})

const tags = await tp.quickPick(
  ['education', 'live', 'math', 'lv1', 'lv2'],
  {
    placeholder: 'Tags',
    canPickMany: true,
  })
  .then(res => res.join(', '))

tp.writeNoteTo(title)
```

# {{title}}

