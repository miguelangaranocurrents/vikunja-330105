import type {Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

// ProseMirror's default plain text copy drops list markers, so a copied list pasted into a
// text field reads as loose lines. Keep the markers so the list still reads as a list.
export function sliceToListText(slice: Slice): string {
	const blocks: string[] = []
	slice.content.forEach(node => blocks.push(blockLines(node).join('\n')))

	return blocks.join('\n\n')
}

function blockLines(node: ProseMirrorNode): string[] {
	if (node.isTextblock) {
		return [node.textContent]
	}

	if (['bulletList', 'orderedList', 'taskList'].includes(node.type.name)) {
		const lines: string[] = []
		let number = node.attrs.start ?? 1
		node.forEach(item => {
			lines.push(...itemLines(item, markerFor(node, item, number)))
			number++
		})
		return lines
	}

	const lines: string[] = []
	node.forEach(child => lines.push(...blockLines(child)))
	return lines
}

function itemLines(item: ProseMirrorNode, marker: string): string[] {
	const content: string[] = []
	item.forEach(child => content.push(...blockLines(child)))

	const padding = ' '.repeat(marker.length)
	return (content.length > 0 ? content : ['']).map((line, i) => (i === 0 ? marker : padding) + line)
}

function markerFor(list: ProseMirrorNode, item: ProseMirrorNode, number: number): string {
	switch (list.type.name) {
		case 'orderedList':
			return `${number}. `
		case 'taskList':
			return item.attrs.checked ? '- [x] ' : '- [ ] '
		default:
			return '- '
	}
}
