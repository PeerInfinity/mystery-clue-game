The other problems name facts from later scenes (`f.holmes_simpson_eliminated`, `f.holmes_visitor_known`, `f.knife_gashes`, `f.holmes_not_gypsies`), so they cannot be fixed with patches to this scene.

Two lines below fix what can be fixed here:
- **`f.holmes_believed_found`:** this patch is withdrawn, because the check would not accept the belief marked false.
- **`f.inf_self_cut`:** the question pick is removed, because "his own knife, as he fell" is not yet a possibility here.

```jsonl
{"file":"patch","id":"f.holmes_believed_found","delete":true}
{"file":"facts","id":"f.inf_self_cut","of":"straker","attr":"action","value":"cuts his own thigh with his knife","time":{"at":"t.crime"},"para":54,"quote":"he wounded himself in his fall","basis":"inferable","from":["f.gregory_self_wound","f.holmes_probable"],"inferable_at":54,"strength":"likely","reasoning":[{"para":54,"text":"Watson suggested it, Holmes called it probable, and the police have concluded the same: Straker's own knife made the cut on his thigh."}],"given_at":226,"given_quote":"as he fell, his knife gashed his thigh"}
```