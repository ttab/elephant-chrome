import type { TBElement } from '@ttab/textbit'
import * as Y from 'yjs'
import { slateNodesToInsertDelta } from '@slate-yjs/core'
import { translate } from '@/shared/translate'

interface TextNode {
  text: string
  [key: string]: unknown
}

function isTextNode(node: unknown): node is TextNode {
  return typeof node === 'object' && node !== null && 'text' in node && typeof (node as TextNode).text === 'string'
}

/**
 * Extract all non-empty text strings from a TBElement tree, preserving order.
 */
function collectTexts(elements: TBElement[]): string[] {
  const texts: string[] = []

  function walk(node: unknown): void {
    if (isTextNode(node)) {
      if (node.text.trim() !== '') {
        texts.push(node.text)
      }
    } else if (typeof node === 'object' && node !== null && 'children' in node) {
      const children = (node as { children: unknown[] }).children
      if (Array.isArray(children)) {
        children.forEach(walk)
      }
    }
  }

  elements.forEach(walk)
  return texts
}

/**
 * Replace non-empty text strings in a TBElement tree with translated texts, in order.
 */
function replaceTexts(elements: TBElement[], translated: string[]): void {
  let index = 0

  function walk(node: unknown): void {
    if (isTextNode(node)) {
      if (node.text.trim() !== '') {
        node.text = translated[index++]
      }
    } else if (typeof node === 'object' && node !== null && 'children' in node) {
      const children = (node as { children: unknown[] }).children
      if (Array.isArray(children)) {
        children.forEach(walk)
      }
    }
  }

  elements.forEach(walk)
}

// Hardcoded personal preferences for testing
const PERSONAL_PREFS = 'bli_verte.vb-bli2verte,eigentleg_eigenleg.stav,barna_borna.vok-o2a,trost_trast.vok-o2a,alter_altar.vok-a2e,jern_jarn.vok-a2e,kvalp_kvelp.vok-a2e,spenn_span.vok-a2e,drikk_drykk.vok-i2y,segle_sigle.vok-e2i,lys_ljos.vok-y2jo,allmenn_ålmenn.vok-a2å,mogleg_mogeleg.vok-2e,sommar_sumar.vok-o2u,jul_jol.vok-u2o,høvding_hovding.vok-ø2o,så_so.vok-o2å,først_fyrst.vok-ø2y,søndag_sundag.vok-ø2u,lykke_lukke.vok-y2u,redsel_redsle.kons-sel2sle,følgje_fylgje.vok-ø_gj2y_gj,auga_augo.vok-a2o,nød_naud.dift-ø2au,dødeleg_døyeleg.dift-ø2øy,kors_kross.stav,true_truge.stav,døgn_døger.stav,linje_line.stav,brud_brur.stav,mørke_mørker.stav,avl_al.stav,blå_blåe.adj,minuttet_minutten.n.nt2m,venn_ven.kons-mm2m,komme_kome.kons-mm2m,dommen_domen.kons-mm2m,kjøtt_kjøt.kons-mm2m,formål_føremål.afx-fore2føre,dess-der_di.afx,forvaltning_forvalting.afx-ning2ing,hemme_hemje.kons-mm2mj,gremme_gremje.kons-mm2mj,eigde_åtte.vb,venne_venje.vb,veps_kvefs.syn,blomster_blome.syn,verken_korkje.syn,fornøgd_nøgd.syn,framfor_framføre.syn,forslag_framlegg.syn,også_og.syn,bety_tyde.syn,oversikt_oversyn.syn,stemme_røyste.syn,samtidig_samstundes.syn,ramme_råke.syn,vise_syne.syn,bestille_tinge.syn,lege_lækjar.syn,nyheit_nyhende.syn,forskjell_skilnad.syn,blant_mellom.syn,hos_hjå.syn,gir_gjev.vb-en2tt,fly_flyge.vb-inf,håpa_håpte.vb-e2a,er_ar.vb-e2a,bygd_bygt.vb-d2t,enkelt_einskild.syn'

/**
 * Convert the comma-separated personal prefs string to the map format
 * expected by the Nynorsk API: { "form_name": { "enabled": true } }
 */
function parsePersonalPrefs(prefsString: string): Record<string, { enabled: boolean }> {
  const prefs: Record<string, { enabled: boolean }> = {}
  for (const key of prefsString.split(',')) {
    if (key) {
      prefs[key] = { enabled: true }
    }
  }
  return prefs
}

/**
 * Convert TBElement content to a Y.XmlText suitable for setting on a Y.Doc.
 */
export function toContentYXmlText(content: TBElement[]): Y.XmlText {
  const yContent = new Y.XmlText()
  yContent.applyDelta(slateNodesToInsertDelta(content))
  return yContent
}

/**
 * Translate wire content from bokmål to nynorsk and return a Y.XmlText
 * suitable for setting as article content on a Y.Doc.
 */
export async function translateWireContent(
  wireContent: TBElement[],
  mode: 'standard' | 'personal'
): Promise<Y.XmlText> {
  const cloned = structuredClone(wireContent)
  const texts = collectTexts(cloned)

  if (texts.length > 0) {
    const result = await translate({
      texts: { values: texts },
      file_type: 'html',
      source_language: 'nb',
      target_language: 'nn',
      prefs_template: 'standard',
      ...(mode === 'personal' ? { prefs: parsePersonalPrefs(PERSONAL_PREFS) } : {})
    })

    if (result.texts?.values?.length === texts.length) {
      replaceTexts(cloned, result.texts.values)
    }
  }

  const yContent = new Y.XmlText()
  yContent.applyDelta(slateNodesToInsertDelta(cloned))
  return yContent
}
