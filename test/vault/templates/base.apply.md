```js
const title = await tp.quickInput({ placeholder: 'Input note\'s title' })
const type = await tp.quickPick(
  ['book', 'video', 'music'], 
  { placeholder: 'Pick note\'s type' },
)

const icon = type === 'book' ? '📕' 
  : type == 'video' ? '🎞' 
  : '🎵'
```

# {{icon}} {{title}}