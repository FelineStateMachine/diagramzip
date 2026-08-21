const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/monaco-editor-C7iaFm9N.js","assets/preload-helper-sgV7L5Mc.js","assets/editor.api-Uy7N5htg.js","assets/editor-jjEx9u7D.css","assets/folding-8eExsY6y.js","assets/folding-BhelvhIs.css"])))=>i.map(i=>d[i]);
import{n as e,t}from"./preload-helper-sgV7L5Mc.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var n=[[`plantuml`,`PlantUML`],[`mermaid`,`Mermaid`],[`graphviz`,`GraphViz`],[`d2`,`D2`],[`c4plantuml`,`C4 PlantUML`],[`blockdiag`,`BlockDiag`],[`seqdiag`,`SeqDiag`],[`actdiag`,`ActDiag`],[`nwdiag`,`NwDiag`],[`packetdiag`,`PacketDiag`],[`rackdiag`,`RackDiag`],[`bpmn`,`BPMN`],[`bytefield`,`Bytefield`],[`dbml`,`DBML`],[`diagramsnet`,`Diagrams.net`],[`ditaa`,`Ditaa`],[`erd`,`ERD`],[`excalidraw`,`Excalidraw`],[`goat`,`GoAT`],[`nomnoml`,`Nomnoml`],[`pikchr`,`Pikchr`],[`structurizr`,`Structurizr`],[`svgbob`,`Svgbob`],[`symbolator`,`Symbolator`],[`tikz`,`TikZ`],[`umlet`,`UMLet`],[`vega`,`Vega`],[`vegalite`,`Vega-Lite`],[`wavedrom`,`WaveDrom`],[`wireviz`,`WireViz`]].map(([e,t])=>({id:e,label:t}));function r(e){return n.some(t=>t.id===e)}function i(e=``){let t=new URLSearchParams(e).get(`type`);return r(t)?t:null}function a(e,t){if(!r(t))throw Error(`Unsupported diagram type.`);let n=new URL(e,`https://diagram.zip`);return n.searchParams.set(`type`,t),`${n.pathname}${n.search}${n.hash}`}var o=`<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:qa="http://some-company/schema/bpmn/qa" id="_RdgBELNaEeSYkoSLDs6j-w" targetNamespace="http://activiti.org/bpmn">
  <bpmn2:process id="Process_1">
    <bpmn2:task id="Task_1" name="Examine Situation" qa:suitable="0.7">
      <bpmn2:outgoing>SequenceFlow_1</bpmn2:outgoing>
      <bpmn2:extensionElements>
        <qa:analysisDetails lastChecked="2015-01-20" nextCheck="2015-07-15">
          <qa:comment author="Klaus">
            Our operators always have a hard time to figure out, what they need to do here.
          </qa:comment>
          <qa:comment author="Walter">
            I believe this can be split up in a number of activities and partly automated.
          </qa:comment>
        </qa:analysisDetails>
      </bpmn2:extensionElements>
    </bpmn2:task>
    <bpmn2:sequenceFlow id="SequenceFlow_1" name="" sourceRef="Task_1" targetRef="ExclusiveGateway_1"/>
    <bpmn2:exclusiveGateway id="ExclusiveGateway_1" name="Things OK?">
      <bpmn2:incoming>SequenceFlow_1</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_2</bpmn2:outgoing>
      <bpmn2:outgoing>SequenceFlow_5</bpmn2:outgoing>
    </bpmn2:exclusiveGateway>
    <bpmn2:sequenceFlow id="SequenceFlow_2" name="" sourceRef="ExclusiveGateway_1" targetRef="EndEvent_1"/>
    <bpmn2:sequenceFlow id="SequenceFlow_5" name="" sourceRef="ExclusiveGateway_1" targetRef="EndEvent_2"/>
    <bpmn2:endEvent id="EndEvent_1" name="Notification Sent">
      <bpmn2:incoming>SequenceFlow_2</bpmn2:incoming>
      <bpmn2:messageEventDefinition id="MessageEventDefinition_1"/>
    </bpmn2:endEvent>
    <bpmn2:endEvent id="EndEvent_2" name="Error Propagated">
      <bpmn2:incoming>SequenceFlow_5</bpmn2:incoming>
      <bpmn2:errorEventDefinition id="ErrorEventDefinition_1"/>
    </bpmn2:endEvent>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_Task_2" bpmnElement="Task_1">
        <dc:Bounds height="80.0" width="100.0" x="96.0" y="196.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_EndEvent_2" bpmnElement="EndEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="396.0" y="300.0"/>
        <bpmndi:BPMNLabel>
          <dc:Bounds height="0.0" width="0.0" x="414.0" y="341.0"/>
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_ExclusiveGateway_2" bpmnElement="ExclusiveGateway_1" isMarkerVisible="true">
        <dc:Bounds height="50.0" width="50.0" x="276.0" y="210.0"/>
        <bpmndi:BPMNLabel>
          <dc:Bounds height="21.0" width="74.0" x="333.0" y="226.0"/>
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="BPMNEdge_SequenceFlow_1" bpmnElement="SequenceFlow_1" sourceElement="_BPMNShape_Task_2" targetElement="_BPMNShape_ExclusiveGateway_2">
        <di:waypoint xsi:type="dc:Point" x="196.0" y="236.0"/>
        <di:waypoint xsi:type="dc:Point" x="276.0" y="235.0"/>
        <bpmndi:BPMNLabel>
          <dc:Bounds height="6.0" width="6.0" x="214.0" y="236.0"/>
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="BPMNEdge_SequenceFlow_2" bpmnElement="SequenceFlow_2" sourceElement="_BPMNShape_ExclusiveGateway_2" targetElement="_BPMNShape_EndEvent_2">
        <di:waypoint xsi:type="dc:Point" x="301.0" y="260.0"/>
        <di:waypoint xsi:type="dc:Point" x="301.0" y="318.0"/>
        <di:waypoint xsi:type="dc:Point" x="396.0" y="318.0"/>
        <bpmndi:BPMNLabel>
          <dc:Bounds height="6.0" width="6.0" x="298.0" y="301.0"/>
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNShape id="_BPMNShape_EndEvent_3" bpmnElement="EndEvent_2">
        <dc:Bounds height="36.0" width="36.0" x="396.0" y="132.0"/>
        <bpmndi:BPMNLabel>
          <dc:Bounds height="0.0" width="0.0" x="414.0" y="173.0"/>
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="BPMNEdge_SequenceFlow_5" bpmnElement="SequenceFlow_5" sourceElement="_BPMNShape_ExclusiveGateway_2" targetElement="_BPMNShape_EndEvent_3">
        <di:waypoint xsi:type="dc:Point" x="301.0" y="210.0"/>
        <di:waypoint xsi:type="dc:Point" x="301.0" y="150.0"/>
        <di:waypoint xsi:type="dc:Point" x="396.0" y="150.0"/>
        <bpmndi:BPMNLabel>
          <dc:Bounds height="6.0" width="6.0" x="333.0" y="150.0"/>
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>
`,s=`(draw-column-headers)
(draw-box "Address" {:span 4})
(draw-box "Size" {:span 2})
(draw-box 0 {:span 2})
(draw-gap "Payload")
(draw-bottom)
`,c=`dogs -> cats -> mice: chase
replica 1 <-> replica 2
a -> b: To err is human, to moo bovine {
  style.animated: true
  source-arrowhead: 1
  target-arrowhead: * {
    shape: diamond
  }
}
`,l=`Table users {
  id integer
  username varchar
  role varchar
  created_at timestamp
}

Table posts {
  id integer [primary key]
  title varchar
  body text [note: 'Content of the post']
  user_id integer
  status post_status
  created_at timestamp
}

Enum post_status {
  draft
  published
  private [note: 'visible via URL only']
}

Ref: posts.user_id > users.id // many-to-one
`,u=`<mxfile host="localhost" modified="2021-05-13T15:13:49.065Z" agent="5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36" etag="wSTZ0NLKJqQDPf-wjMNB" version="@DRAWIO-VERSION@" type="device"><diagram id="3228e29e-7158-1315-38df-8450db1d8a1d" name="Page-1">3VpdU+s4DP01PK5HtiTLfmwL3H3ZJ3Zmn0Mb2s4tTSeEBfbXr0LT2wbncvkI7WYDMzSy3CTnyEeSwxlObh+/ldlm8Ucxy1dnDmaPZ3h+5pwlCPqntjxtLUKNYV4uZ43T3nC1/CdvjNBY75ez/K7lWBXFqlpu2sZpsV7n06ply8qyeGi73RSr9lU32TxPDFfTbJVa/1rOqkVjtT7uB37Pl/NFc+ngZDtwnU2/z8vift1cb12s8+3Ibbb7muYZ7xbZrHg4MOHFGU7Koqi2n24fJ/mqhnWH2Hbe5U9Gf9xyma+rt0xwlqmZ9He2um+evLm36mkHhU5S1PVk/LBYVvnVJpvWIw9KvNrKosqqZbFWy28IarhZrlaTYlWUz7PxEoIAq73QecuqDgdfu91VZfE93zk+o4TjRXW70jOrH9OH2d1qXlb544GpebhveXGbV+WTujSj6MAgWYsueI8hNAw1EenYG+/QEgs7jLaJz4c92zrFQAAOzlvhgNFvXRYHvFv9FhSOFAOCOAqNT9bE3/zHXe2J0A8NFz/nxfXIi0VOebkI7PUqp+DFW2fIO6+/7NFjygt7G0J0IZLeJSbE2MgmgKOamaAnMeXFARknMQrqohUl0fbDC36Wlxc0uEsey+QkNDBYDd0YrUdG8YDU5gHZOOuDJ3ZgrfPp+hDoWBAE/SBNPSNt3Wg0fqsQHa4e7h15wmgsB+s9K7awg/ZpB6s1KkkcKIJlQKAEeRetcQREEFXYkEQ6iHA9EcF9pgjqSBGCfjIKJ1kDpBIfiFBCtFFUcNpMeDQYFGjkCACRO4hgQ6A5RKcCk0TqIALEuEBWPFJEiNH1w4tPeBklxCgMVY1kDex6/mexqTl4zgbFurpq/GB3vq3CLLVhrocOE/rz0RP84gy3IbdBARUBDwGDIHfITofq9BXrkmA6HhqmwvACUw1Qzaiq7xIFNBKjHBXTkGA6GRqmAYLRYkUlNWrVwbEt2FpenjJmY4Lv+dDw9ULtUqQdvwLGa65UB4xoO2T4C+FlSOC9GBq8TIkkxHaN4Y4qCZx2naPBaQIzGZF6wQNq+xjbpYPKrDlunKYd43hwmIrnpB44pbZy2u6Nhoeqd+EVdXXxpAinbd54MjiB1S75FYQRgxGwQThErjeLjgpw2r6N/2/4hlPWt5z2YePhFWBRO12P2gVLBPL2RbWApF2yDb7eM6r37Y6Kb0dPdj68CE67MutMjBEic0Br/XGrhbQpGw0uaElrLF37pFAK2wD+Remgw0E1g2zUoCXXscH/hQB3dGWDC1ptD14pcYlOKbs+7cvS7a8370t27ErefPDF1bzMZst8z0njccggfy1tCrFhODhebFcwGl06on21hQAdyyLWwrQ/OvY0lfrgg3gR0gN3+eKznKZ9Ybr99hlO8w++9Do2eW0dg1/wRR2rTEtOiFrb67L1tfpRPwSlTWbaDb3v/dcNX8t0aIywN6CwkmZuAXkrJWLIqVoGbbL0x0o/lKQtaprI3/miLMuuPyB8J6WEgA1GrVRBIvlgO7rYIy6TtKlNc/9ndEzQT7MPvDH77yQhYjIuIEBg9BARO8rfX6chdXFgRbkTFUfaFV3voE9P9/9w8zx28A9NePEv</diagram></mxfile>`,d=`[Person]
*name
height
weight
+birth_location_id

[Location]
*id
city
state
country

Person *--1 Location
`,f=`{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "id": "vWrqOAfkind2qcm7LDAGZ",
      "type": "ellipse",
      "x": 414,
      "y": 237,
      "width": 214,
      "height": 214,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#15aabf",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "strokeSharpness": "sharp",
      "seed": 1041657908,
      "version": 120,
      "versionNonce": 1188004276,
      "isDeleted": false,
      "boundElementIds": null
    },
    {
      "id": "rC-02l026X3SWaucOxDw9",
      "type": "ellipse",
      "x": 563,
      "y": 236,
      "width": 214,
      "height": 214,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#40c057",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "strokeSharpness": "sharp",
      "seed": 476355980,
      "version": 169,
      "versionNonce": 830055604,
      "isDeleted": false,
      "boundElementIds": null
    },
    {
      "id": "DrhW4ZSEpniMojuzsiqvi",
      "type": "ellipse",
      "x": 476,
      "y": 358,
      "width": 214,
      "height": 214,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#7950f2",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "strokeSharpness": "sharp",
      "seed": 1966042508,
      "version": 119,
      "versionNonce": 1553878324,
      "isDeleted": false,
      "boundElementIds": null
    },
    {
      "id": "NMI4ix1W7sQ6z9EDdYwc7",
      "type": "arrow",
      "x": 384.12748830144295,
      "y": 207.60779895196669,
      "width": 119.87251169855705,
      "height": 100.39220104803331,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#7950f2",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "strokeSharpness": "round",
      "seed": 1656470796,
      "version": 69,
      "versionNonce": 1460943500,
      "isDeleted": false,
      "boundElementIds": null,
      "points": [
        [
          0,
          0
        ],
        [
          119.87251169855705,
          100.39220104803331
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": {
        "elementId": "3J8-URSbMsKSvZ2TvCc3K",
        "focus": 0.2594107757283838,
        "gap": 7.607798951966686
      },
      "endBinding": null
    },
    {
      "id": "QixLrxvPLw7TbG6VJJ9dj",
      "type": "arrow",
      "x": 652.9917772874236,
      "y": 609.5185939229559,
      "width": 61.74239993095398,
      "height": 105.02421977738851,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#40c057",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "strokeSharpness": "round",
      "seed": 738941452,
      "version": 107,
      "versionNonce": 1655140148,
      "isDeleted": false,
      "boundElementIds": null,
      "points": [
        [
          0,
          0
        ],
        [
          -61.74239993095398,
          -105.02421977738851
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": {
        "elementId": "dhyExWoj7pia0unVwtXeL",
        "focus": 0.1480924722475781,
        "gap": 8.481406077044085
      },
      "endBinding": null
    },
    {
      "id": "LBRnTRdXKmkt5IwhKJLDC",
      "type": "arrow",
      "x": 806.9784146802895,
      "y": 212.38825479040858,
      "width": 104.97841468028946,
      "height": 96.61174520959142,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#40c057",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "strokeSharpness": "round",
      "seed": 751503500,
      "version": 69,
      "versionNonce": 1180701708,
      "isDeleted": false,
      "boundElementIds": null,
      "points": [
        [
          0,
          0
        ],
        [
          -104.97841468028946,
          96.61174520959142
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": {
        "elementId": "7fiPETvGUweaqK1VIn2zu",
        "focus": -0.07338204068894764,
        "gap": 9.388254790408553
      },
      "endBinding": null
    },
    {
      "id": "VFSwfD_HsZyf5SBKdiFDz",
      "type": "arrow",
      "x": 599.140263160093,
      "y": 191.4445904184276,
      "width": 3.62529516014456,
      "height": 206.31238589940077,
      "angle": 0.13471642395161876,
      "strokeColor": "#000000",
      "backgroundColor": "#40c057",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "strokeSharpness": "round",
      "seed": 1721266612,
      "version": 192,
      "versionNonce": 1388066444,
      "isDeleted": false,
      "boundElementIds": null,
      "points": [
        [
          0,
          0
        ],
        [
          3.62529516014456,
          206.31238589940077
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null
    },
    {
      "id": "3J8-URSbMsKSvZ2TvCc3K",
      "type": "text",
      "x": 314,
      "y": 175,
      "width": 135,
      "height": 25,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#40c057",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "strokeSharpness": "sharp",
      "seed": 1793099060,
      "version": 43,
      "versionNonce": 2135655476,
      "isDeleted": false,
      "boundElementIds": [
        "NMI4ix1W7sQ6z9EDdYwc7"
      ],
      "text": "want to draw",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 18
    },
    {
      "id": "7fiPETvGUweaqK1VIn2zu",
      "type": "text",
      "x": 782,
      "y": 178,
      "width": 89,
      "height": 25,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#40c057",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "strokeSharpness": "sharp",
      "seed": 1750780940,
      "version": 38,
      "versionNonce": 1584702860,
      "isDeleted": false,
      "boundElementIds": [
        "LBRnTRdXKmkt5IwhKJLDC"
      ],
      "text": "can draw",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 18
    },
    {
      "id": "dhyExWoj7pia0unVwtXeL",
      "type": "text",
      "x": 612,
      "y": 618,
      "width": 91,
      "height": 25,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#40c057",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "strokeSharpness": "sharp",
      "seed": 1228201396,
      "version": 105,
      "versionNonce": 288443916,
      "isDeleted": false,
      "boundElementIds": [
        "QixLrxvPLw7TbG6VJJ9dj"
      ],
      "text": "have time",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 18
    },
    {
      "id": "PKjjaNpqiOpZQ7kml-d18",
      "type": "text",
      "x": 567,
      "y": 148,
      "width": 88,
      "height": 25,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#40c057",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "strokeSharpness": "sharp",
      "seed": 152899636,
      "version": 105,
      "versionNonce": 1333089972,
      "isDeleted": false,
      "boundElementIds": [],
      "text": "NOT ME!",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 18
    }
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": null
  }
}
`,p=`+-------------------+                           ^                      .---.
|      ‗A Box‗      |__.--.__    __.-->         |      .-.             |   |
|                   |        '--'               v     | * |<---        |   |
+-------------------+                                  '-'             |   |
                        \`Round\`                                    *---(-. |
  .-----------------.  .-------.    .----------.         .-------.     | | |
 |   Mixed Rounded  | |         |  / Diagonals  \\        |   |   |     | | |
 | & Square Corners |  '--. .--'  /              \\       |---+---|     '-)-'       .--------.
 '--+------------+-'  .--. |     '-------+--------'      |   |   |       |        / Search /
    |            |   |    | '---.        |               '-------'       |       '-+------'
    |<---------->|   |    |      |       v                Interior                 |     ^
    '           <---'      '----'   .-----------.              ---.     .---       v     |
 .------------------.  Diag line    | .-------. +---.              \\   /           .     |
 |   if (a > b)     +---.      .--->| |       | |    |\`Curved line\` \\ /           / \\    |
 |   obj->fcn()     |    \\    /     | '-------' |<--'                +           /   \\   |
 '------------------'     '--'      '--+--------'      .--. .--.     |  .-.     +Done?+-'
    .---+-----.                        |   ^           |\\ | | /|  .--+ |   |     \\   /
    |   |     | Join        \\|/        |   | \`Curved\`  | \\| |/ | |    \\    |      \\ /
    |   |     +---->  o    --o--        '-'  Vertical  '--' '--'  '--  '--'        +  .---.
 <--+---+-----'       |     /|\\                                                    |  | 3 |
                      v                             not:line    'quotes'        .-'   '---'
  .-.             .---+--------.            /            A || B   ·bold·       |        ^
 |   |           |   Not a dot  |      <---+---<--    A dash--is not a line    v        |
  '-'             '---------+--'          /           Nor/is this.            ---
`,m=`[Pirate|eyeCount: Int|raid();pillage()|
  [beard]--[parrot]
  [beard]-:>[foul mouth]
]

[<abstract>Marauder]<:--[Pirate]
[Pirate]- 0..7[mischief]
[jollyness]->[Pirate]
[jollyness]->[rum]
[jollyness]->[singing]
[Pirate]-> *[rum|tastiness: Int|swig()]
[Pirate]->[singing]
[singing]<->[rum]
`,h=`nwdiag {
  network dmz {
    address = "210.x.x.x/24"

    web01 [address = "210.x.x.1"];
    web02 [address = "210.x.x.2"];
  }
  network internal {
    address = "172.x.x.x/24";

    web01 [address = "172.x.x.1"];
    web02 [address = "172.x.x.2"];
    db01;
    db02;
  }
}
`,ee=`packetdiag {
  colwidth = 32;
  node_height = 72;

  0-15: Source Port;
  16-31: Destination Port;
  32-63: Sequence Number;
  64-95: Acknowledgment Number;
  96-99: Data Offset;
  100-105: Reserved;
  106: URG [rotate = 270];
  107: ACK [rotate = 270];
  108: PSH [rotate = 270];
  109: RST [rotate = 270];
  110: SYN [rotate = 270];
  111: FIN [rotate = 270];
  112-127: Window;
  128-143: Checksum;
  144-159: Urgent Pointer;
  160-191: (Options and Padding);
  192-223: data [colheight = 3];
}
`,te=`D: diamond "Cardinal" "Points"
   dot ".n" above at D.n
   dot " .e" ljust at D.e
   dot ".s" below at D.s
   dot ".w " rjust at D.w
`,g=`rackdiag {
  16U;
  1: UPS [2U];
  3: DB Server;
  4: Web Server;
  5: Web Server;
  6: Web Server;
  7: Load Balancer;
  8: L3 Switch;
}
`,_=`                  .-,(  ),-.
   ___  _      .-(          )-.
  [___]|=| -->(                )      __________
  /::/ |_|     '-(          ).-' --->[_...__... ]
                  '-.( ).-'
                          \\      ____   __
                           '--->|    | |==|
                                |____| |  |
                                /::::/ |__|
`,ne=`module demo_device #(
    //# {{}}
    parameter SIZE = 8,
    parameter RESET_ACTIVE_LEVEL = 1
) (
    //# {{clocks|Clocking}}
    input wire clock,
    //# {{control|Control signals}}
    input wire reset,
    input wire enable,
    //# {{data|Data ports}}
    input wire [SIZE-1:0] data_in,
    output wire [SIZE-1:0] data_out
);
  // ...
endmodule`,re=`% From: https://tikz.net/periodic-table/

% Adapted from https://texample.net/tikz/examples/periodic-table-of-chemical-elements.
% All Credit to Ivan Griffin.

\\documentclass[tikz,border=5mm]{standalone}
\\usetikzlibrary{shapes,calc}

\\begin{document}

\\newcommand{\\ElemLabel}[4]{
  \\begin{minipage}{2.2cm}
    \\centering
      {\\textbf{#1} \\hfill #2}%
      \\linebreak \\linebreak
      {\\textbf{#3}}%
      \\linebreak \\linebreak
      {{#4}}
  \\end{minipage}
}

\\newcommand{\\NaturalElem}[4]{\\ElemLabel{#1}{#2}{\\huge {#3}}{#4}}

\\newcommand{\\SyntheticElem}[4]{\\ElemLabel{#1}{#2}{\\color{gray}{\\huge #3}}{#4}}

\\begin{tikzpicture}[font=\\sffamily]

  % Fill Color Styles
  \\tikzstyle{ElementFill} = [fill=yellow!15]
  \\tikzstyle{AlkaliMetalFill} = [fill=blue!55]
  \\tikzstyle{AlkalineEarthMetalFill} = [fill=blue!40]
  \\tikzstyle{MetalFill} = [fill=blue!25]
  \\tikzstyle{MetalloidFill} = [fill=orange!40]
  \\tikzstyle{NonmetalFill} = [fill=teal!40]
  \\tikzstyle{HalogenFill} = [fill=yellow!40]
  \\tikzstyle{NobleGasFill} = [fill=green!55]
  \\tikzstyle{LanthanideActinideFill} = [fill=red!40]

  % Element Styles
  \\tikzstyle{Element} = [ElementFill,
    minimum width=2.5cm, minimum height=2.5cm, node distance=2.75cm]
  \\tikzstyle{AlkaliMetal} = [Element, AlkaliMetalFill]
  \\tikzstyle{AlkalineEarthMetal} = [Element, AlkalineEarthMetalFill]
  \\tikzstyle{Metal} = [Element, MetalFill]
  \\tikzstyle{Metalloid} = [Element, MetalloidFill]
  \\tikzstyle{Nonmetal} = [Element, NonmetalFill]
  \\tikzstyle{Halogen} = [Element, HalogenFill]
  \\tikzstyle{NobleGas} = [Element, NobleGasFill]
  \\tikzstyle{LanthanideActinide} = [Element, LanthanideActinideFill]
  \\tikzstyle{PeriodLabel} = [font={\\sffamily\\LARGE}, node distance=2.0cm]
  \\tikzstyle{GroupLabel} = [font={\\sffamily\\LARGE}, minimum width=2.75cm, node distance=2.0cm]

  % Group 1 - IA
  \\node[Element] (H) {\\NaturalElem{1} {1.0079}{H}{Hydrogen}};
  \\node[below of=H, AlkaliMetal] (Li) {\\NaturalElem{3}{6.941}{Li}{Lithium}};
  \\node[below of=Li, AlkaliMetal] (Na) {\\NaturalElem{11}{22.990}{Na}{Sodium}};
  \\node[below of=Na, AlkaliMetal] (K) {\\NaturalElem{19}{39.098}{K}{Potassium}};
  \\node[below of=K, AlkaliMetal] (Rb) {\\NaturalElem{37}{85.468}{Rb}{Rubidium}};
  \\node[below of=Rb, AlkaliMetal] (Cs) {\\NaturalElem{55}{132.91}{Cs}{Caesium}};
  \\node[below of=Cs, AlkaliMetal] (Fr) {\\NaturalElem{87}{223}{Fr}{Francium}};

  % Group 2 - IIA
  \\node[right of=Li, AlkalineEarthMetal] (Be) {\\NaturalElem{4}{9.0122}{Be}{Beryllium}};
  \\node[below of=Be, AlkalineEarthMetal] (Mg) {\\NaturalElem{12}{24.305}{Mg}{Magnesium}};
  \\node[below of=Mg, AlkalineEarthMetal] (Ca) {\\NaturalElem{20}{40.078}{Ca}{Calcium}};
  \\node[below of=Ca, AlkalineEarthMetal] (Sr) {\\NaturalElem{38}{87.62}{Sr}{Strontium}};
  \\node[below of=Sr, AlkalineEarthMetal] (Ba) {\\NaturalElem{56}{137.33}{Ba}{Barium}};
  \\node[below of=Ba, AlkalineEarthMetal] (Ra) {\\NaturalElem{88}{226}{Ra}{Radium}};

  % Group 3 - IIIB
  \\node[right of=Ca, Metal] (Sc) {\\NaturalElem{21}{44.956}{Sc}{Scandium}};
  \\node[below of=Sc, Metal] (Y) {\\NaturalElem{39}{88.906}{Y}{Yttrium}};
  \\node[below of=Y, LanthanideActinide] (LaLu) {\\NaturalElem{57-71}{}{La-Lu}{Lanthanide}};
  \\node[below of=LaLu, LanthanideActinide] (AcLr) {\\NaturalElem{89-103}{}{Ac-Lr}{Actinide}};

  % Group 4 - IVB
  \\node[right of=Sc, Metal] (Ti) {\\NaturalElem{22}{47.867}{Ti}{Titanium}};
  \\node[below of=Ti, Metal] (Zr) {\\NaturalElem{40}{91.224}{Zr}{Zirconium}};
  \\node[below of=Zr, Metal] (Hf) {\\NaturalElem{72}{178.49}{Hf}{Hafnium}};
  \\node[below of=Hf, Metal] (Rf) {\\SyntheticElem{104}{261}{Rf}{Rutherfordium}};

  % Group 5 - VB
  \\node[right of=Ti, Metal] (V) {\\NaturalElem{23}{50.942}{V}{Vanadium}};
  \\node[below of=V, Metal] (Nb) {\\NaturalElem{41}{92.906}{Nb}{Niobium}};
  \\node[below of=Nb, Metal] (Ta) {\\NaturalElem{73}{180.95}{Ta}{Tantalum}};
  \\node[below of=Ta, Metal] (Db) {\\SyntheticElem{105}{262}{Db}{Dubnium}};

  % Group 6 - VIB
  \\node[right of=V, Metal] (Cr) {\\NaturalElem{24}{51.996}{Cr}{Chromium}};
  \\node[below of=Cr, Metal] (Mo) {\\NaturalElem{42}{95.94}{Mo}{Molybdenum}};
  \\node[below of=Mo, Metal] (W) {\\NaturalElem{74}{183.84}{W}{Tungsten}};
  \\node[below of=W, Metal] (Sg) {\\SyntheticElem{106}{266}{Sg}{Seaborgium}};

  % Group 7 - VIIB
  \\node[right of=Cr, Metal] (Mn) {\\NaturalElem{25}{54.938}{Mn}{Manganese}};
  \\node[below of=Mn, Metal] (Tc) {\\NaturalElem{43}{96}{Tc}{Technetium}};
  \\node[below of=Tc, Metal] (Re) {\\NaturalElem{75}{186.21}{Re}{Rhenium}};
  \\node[below of=Re, Metal] (Bh) {\\SyntheticElem{107}{264}{Bh}{Bohrium}};

  % Group 8 - VIIIB
  \\node[right of=Mn, Metal] (Fe) {\\NaturalElem{26}{55.845}{Fe}{Iron}};
  \\node[below of=Fe, Metal] (Ru) {\\NaturalElem{44}{101.07}{Ru}{Ruthenium}};
  \\node[below of=Ru, Metal] (Os) {\\NaturalElem{76}{190.23}{Os}{Osmium}};
  \\node[below of=Os, Metal] (Hs) {\\SyntheticElem{108}{277}{Hs}{Hassium}};

  % Group 9 - VIIIB
  \\node[right of=Fe, Metal] (Co) {\\NaturalElem{27}{58.933}{Co}{Cobalt}};
  \\node[below of=Co, Metal] (Rh) {\\NaturalElem{45}{102.91}{Rh}{Rhodium}};
  \\node[below of=Rh, Metal] (Ir) {\\NaturalElem{77}{192.22}{Ir}{Iridium}};
  \\node[below of=Ir, Metal] (Mt) {\\SyntheticElem{109}{268}{Mt}{Meitnerium}};

  % Group 10 - VIIIB
  \\node[right of=Co, Metal] (Ni) {\\NaturalElem{28}{58.693}{Ni}{Nickel}};
  \\node[below of=Ni, Metal] (Pd) {\\NaturalElem{46}{106.42}{Pd}{Palladium}};
  \\node[below of=Pd, Metal] (Pt) {\\NaturalElem{78}{195.08}{Pt}{Platinum}};
  \\node[below of=Pt, Metal] (Ds) {\\SyntheticElem{110}{281}{Ds}{Darmstadtium}};

  % Group 11 - IB
  \\node[right of=Ni, Metal] (Cu) {\\NaturalElem{29}{63.546}{Cu}{Copper}};
  \\node[below of=Cu, Metal] (Ag) {\\NaturalElem{47}{107.87}{Ag}{Silver}};
  \\node[below of=Ag, Metal] (Au) {\\NaturalElem{79}{196.97}{Au}{Gold}};
  \\node[below of=Au, Metal] (Rg) {\\SyntheticElem{111}{280}{Rg}{Roentgenium}};

  % Group 12 - IIB
  \\node[right of=Cu, Metal] (Zn) {\\NaturalElem{30}{65.39}{Zn}{Zinc}};
  \\node[below of=Zn, Metal] (Cd) {\\NaturalElem{48}{112.41}{Cd}{Cadmium}};
  \\node[below of=Cd, Metal] (Hg) {\\NaturalElem{80}{200.59}{Hg}{Mercury}};
  \\node[below of=Hg, Metal] (Uub) {\\SyntheticElem{112}{285}{Uub}{Ununbium}};

  % Group 13 - IIIA
  \\node[right of=Zn, Metal] (Ga) {\\NaturalElem{31}{69.723}{Ga}{Gallium}};
  \\node[above of=Ga, Metal] (Al) {\\NaturalElem{13}{26.982}{Al}{Aluminium}};
  \\node[above of=Al, Metalloid] (B) {\\NaturalElem{5}{10.811}{B}{Boron}};
  \\node[below of=Ga, Metal] (In) {\\NaturalElem{49}{114.82}{In}{Indium}};
  \\node[below of=In, Metal] (Tl) {\\NaturalElem{81}{204.38}{Tl}{Thallium}};
  \\node[below of=Tl, Metal] (Uut) {\\SyntheticElem{113}{284}{Uut}{Ununtrium}};

  % Group 14 - IVA
  \\node[right of=B, Nonmetal] (C) {\\NaturalElem{6}{12.011}{C}{Carbon}};
  \\node[below of=C, Metalloid] (Si) {\\NaturalElem{14}{28.086}{Si}{Silicon}};
  \\node[below of=Si, Metalloid] (Ge) {\\NaturalElem{32}{72.64}{Ge}{Germanium}};
  \\node[below of=Ge, Metal] (Sn) {\\NaturalElem{50}{118.71}{Sn}{Tin}};
  \\node[below of=Sn, Metal] (Pb) {\\NaturalElem{82}{207.2}{Pb}{Lead}};
  \\node[below of=Pb, Metal] (Uuq) {\\SyntheticElem{114}{289}{Uuq}{Ununquadium}};

  % Group 15 - VA
  \\node[right of=C, Nonmetal] (N) {\\NaturalElem{7}{14.007}{N}{Nitrogen}};
  \\node[below of=N, Nonmetal] (P) {\\NaturalElem{15}{30.974}{P}{Phosphorus}};
  \\node[below of=P, Metalloid] (As) {\\NaturalElem{33}{74.922}{As}{Arsenic}};
  \\node[below of=As, Metalloid] (Sb) {\\NaturalElem{51}{121.76}{Sb}{Antimony}};
  \\node[below of=Sb, Metal] (Bi) {\\NaturalElem{83}{208.98}{Bi}{Bismuth}};
  \\node[below of=Bi, Metal] (Uup) {\\SyntheticElem{115}{288}{Uup}{Ununpentium}};

  % Group 16 - VIA
  \\node[right of=N, Nonmetal] (O) {\\NaturalElem{8}{15.999}{O}{Oxygen}};
  \\node[below of=O, Nonmetal] (S) {\\NaturalElem{16}{32.065}{S}{Sulphur}};
  \\node[below of=S, Nonmetal] (Se) {\\NaturalElem{34}{78.96}{Se}{Selenium}};
  \\node[below of=Se, Metalloid] (Te) {\\NaturalElem{52}{127.6}{Te}{Tellurium}};
  \\node[below of=Te, Metalloid] (Po) {\\NaturalElem{84}{209}{Po}{Polonium}};
  \\node[below of=Po, Metal] (Uuh) {\\SyntheticElem{116}{293}{Uuh}{Ununhexium}};

  % Group 17 - VIIA
  \\node[right of=O, Halogen] (F) {\\NaturalElem{9}{18.998}{F}{Fluorine}};
  \\node[below of=F, Halogen] (Cl) {\\NaturalElem{17}{35.453}{Cl}{Chlorine}};
  \\node[below of=Cl, Halogen] (Br) {\\NaturalElem{35}{79.904}{Br}{Bromine}};
  \\node[below of=Br, Halogen] (I) {\\NaturalElem{53}{126.9}{I}{Iodine}};
  \\node[below of=I, Halogen] (At) {\\NaturalElem{85}{210}{At}{Astatine}};
  \\node[below of=At, Element] (Uus) {\\SyntheticElem{117}{292}{Uus}{Ununseptium}};

  % Group 18 - VIIIA
  \\node[right of=F, NobleGas] (Ne) {\\NaturalElem{10}{20.180}{Ne}{Neon}};
  \\node[above of=Ne, NobleGas] (He) {\\NaturalElem{2}{4.0025}{He}{Helium}};
  \\node[below of=Ne, NobleGas] (Ar) {\\NaturalElem{18}{39.948}{Ar}{Argon}};
  \\node[below of=Ar, NobleGas] (Kr) {\\NaturalElem{36}{83.8}{Kr}{Krypton}};
  \\node[below of=Kr, NobleGas] (Xe) {\\NaturalElem{54}{131.29}{Xe}{Xenon}};
  \\node[below of=Xe, NobleGas] (Rn) {\\NaturalElem{86}{222}{Rn}{Radon}};
  \\node[below of=Rn, Nonmetal] (Uuo) {\\SyntheticElem{118}{294}{Uuo}{Ununoctium}};

  % Period
  \\node[left of=H, PeriodLabel] (Period1) {1};
  \\node[left of=Li, PeriodLabel] (Period2) {2};
  \\node[left of=Na, PeriodLabel] (Period3) {3};
  \\node[left of=K, PeriodLabel] (Period4) {4};
  \\node[left of=Rb, PeriodLabel] (Period5) {5};
  \\node[left of=Cs, PeriodLabel] (Period6) {6};
  \\node[left of=Fr, PeriodLabel] (Period7) {7};

  % Group
  \\node[above of=H, GroupLabel] (Group1) {1 \\hfill IA};
  \\node[above of=Be, GroupLabel] (Group2) {2 \\hfill IIA};
  \\node[above of=Sc, GroupLabel] (Group3) {3 \\hfill IIIA};
  \\node[above of=Ti, GroupLabel] (Group4) {4 \\hfill IVB};
  \\node[above of=V, GroupLabel] (Group5) {5 \\hfill VB};
  \\node[above of=Cr, GroupLabel] (Group6) {6 \\hfill VIB};
  \\node[above of=Mn, GroupLabel] (Group7) {7 \\hfill VIIB};
  \\node[above of=Fe, GroupLabel] (Group8) {8 \\hfill VIIIB};
  \\node[above of=Co, GroupLabel] (Group9) {9 \\hfill VIIIB};
  \\node[above of=Ni, GroupLabel] (Group10) {10 \\hfill VIIIB};
  \\node[above of=Cu, GroupLabel] (Group11) {11 \\hfill IB};
  \\node[above of=Zn, GroupLabel] (Group12) {12 \\hfill IIB};
  \\node[above of=B, GroupLabel] (Group13) {13 \\hfill IIIA};
  \\node[above of=C, GroupLabel] (Group14) {14 \\hfill IVA};
  \\node[above of=N, GroupLabel] (Group15) {15 \\hfill VA};
  \\node[above of=O, GroupLabel] (Group16) {16 \\hfill VIA};
  \\node[above of=F, GroupLabel] (Group17) {17 \\hfill VIIA};
  \\node[above of=He, GroupLabel] (Group18) {18 \\hfill VIIIA};

  % Lanthanide
  \\node[below of=Rf, LanthanideActinide, yshift=-1cm] (La) {\\NaturalElem{57}{138.91}{La}{Lanthanum}};
  \\node[right of=La, LanthanideActinide] (Ce) {\\NaturalElem{58}{140.12}{Ce}{Cerium}};
  \\node[right of=Ce, LanthanideActinide] (Pr) {\\NaturalElem{59}{140.91}{Pr}{Praseodymium}};
  \\node[right of=Pr, LanthanideActinide] (Nd) {\\NaturalElem{60}{144.24}{Nd}{Neodymium}};
  \\node[right of=Nd, LanthanideActinide] (Pm) {\\NaturalElem{61}{145}{Pm}{Promethium}};
  \\node[right of=Pm, LanthanideActinide] (Sm) {\\NaturalElem{62}{150.36}{Sm}{Samarium}};
  \\node[right of=Sm, LanthanideActinide] (Eu) {\\NaturalElem{63}{151.96}{Eu}{Europium}};
  \\node[right of=Eu, LanthanideActinide] (Gd) {\\NaturalElem{64}{157.25}{Gd}{Gadolinium}};
  \\node[right of=Gd, LanthanideActinide] (Tb) {\\NaturalElem{65}{158.93}{Tb}{Terbium}};
  \\node[right of=Tb, LanthanideActinide] (Dy) {\\NaturalElem{66}{162.50}{Dy}{Dysprosium}};
  \\node[right of=Dy, LanthanideActinide] (Ho) {\\NaturalElem{67}{164.93}{Ho}{Holmium}};
  \\node[right of=Ho, LanthanideActinide] (Er) {\\NaturalElem{68}{167.26}{Er}{Erbium}};
  \\node[right of=Er, LanthanideActinide] (Tm) {\\NaturalElem{69}{168.93}{Tm}{Thulium}};
  \\node[right of=Tm, LanthanideActinide] (Yb) {\\NaturalElem{70}{173.04}{Yb}{Ytterbium}};
  \\node[right of=Yb, LanthanideActinide] (Lu) {\\NaturalElem{71}{174.97}{Lu}{Lutetium}};

  % Actinide
  \\node[below of=La, LanthanideActinide, yshift=-1cm] (Ac) {\\NaturalElem{89}{227}{Ac}{Actinium}};
  \\node[right of=Ac, LanthanideActinide] (Th) {\\NaturalElem{90}{232.04}{Th}{Thorium}};
  \\node[right of=Th, LanthanideActinide] (Pa) {\\NaturalElem{91}{231.04}{Pa}{Protactinium}};
  \\node[right of=Pa, LanthanideActinide] (U) {\\NaturalElem{92}{238.03}{U}{Uranium}};
  \\node[right of=U, LanthanideActinide] (Np) {\\SyntheticElem{93}{237}{Np}{Neptunium}};
  \\node[right of=Np, LanthanideActinide] (Pu) {\\SyntheticElem{94}{244}{Pu}{Plutonium}};
  \\node[right of=Pu, LanthanideActinide] (Am) {\\SyntheticElem{95}{243}{Am}{Americium}};
  \\node[right of=Am, LanthanideActinide] (Cm) {\\SyntheticElem{96}{247}{Cm}{Curium}};
  \\node[right of=Cm, LanthanideActinide] (Bk) {\\SyntheticElem{97}{247}{Bk}{Berkelium}};
  \\node[right of=Bk, LanthanideActinide] (Cf) {\\SyntheticElem{98}{251}{Cf}{Californium}};
  \\node[right of=Cf, LanthanideActinide] (Es) {\\SyntheticElem{99}{252}{Es}{Einsteinium}};
  \\node[right of=Es, LanthanideActinide] (Fm) {\\SyntheticElem{100}{257}{Fm}{Fermium}};
  \\node[right of=Fm, LanthanideActinide] (Md) {\\SyntheticElem{101}{258}{Md}{Mendelevium}};
  \\node[right of=Md, LanthanideActinide] (No) {\\SyntheticElem{102}{259}{No}{Nobelium}};
  \\node[right of=No, LanthanideActinide] (Lr) {\\SyntheticElem{103}{262}{Lr}{Lawrencium}};

  % Draw dotted lines connecting Lanthanide breakout to main table
  \\draw[thick,dotted] (LaLu.north west) -- (La.north west)
        (LaLu.south west) -- (La.south west);
  % Draw dotted lines connecting Actinide breakout to main table
  \\draw[thick,dotted] (AcLr.north west) -- (Ac.north west)
        (AcLr.south west) -- (Ac.south west);

  % Legend
   \\fill[AlkaliMetalFill] ($(La.north -| Fr.west) + (0,1em)$)
     rectangle +(1em, 1em) node[right, yshift=-1.2ex]  (AlkaliMetal) {Alkali Metal};
   \\fill[AlkalineEarthMetalFill] ($(AlkaliMetal.west) - (1em,2em)$)
     rectangle +(1em, 1em) node[right, yshift=-1.2ex] (AlkalineEarthMetal) {Alkaline Earth Metal};
   \\fill[MetalFill] ($(AlkalineEarthMetal.west) - (1em,2em)$)
     rectangle +(1em, 1em) node[right, yshift=-1.2ex] (Metal) {Metal};
   \\fill[MetalloidFill] ($(Metal.west) - (1em,2em)$)
     rectangle +(1em, 1em) node[right, yshift=-1.2ex] (Metalloid) {Metalloid};
   \\fill[NonmetalFill] ($(Metalloid.west) - (1em,2em)$)
     rectangle +(1em, 1em) node[right, yshift=-1.2ex] (Non-metal) {Non-metal};
   \\fill[HalogenFill] ($(Non-metal.west) - (1em,2em)$)
     rectangle +(1em, 1em) node[right, yshift=-1.2ex] (Halogen) {Halogen};
   \\fill[NobleGasFill] ($(Halogen.west) - (1em,2em)$)
     rectangle +(1em, 1em) node[right, yshift=-1.2ex] (NobleGas) {Noble Gas};
   \\fill[LanthanideActinideFill] ($(NobleGas.west) - (1em,2em)$)
     rectangle +(1em, 1em) node[right, yshift=-1.2ex] (Lanthanide/Actinide) {Lanthanide/Actinide};

  \\node at (Ac -| Fr) [draw, Element, fill=white] (legend) {\\NaturalElem{Z}{mass}{\\LARGE Symbol}{Name}};
  \\node[align=left] at (Ac -| Ra) {black: natural\\\\\\color{gray}gray: man-made};

  % Diagram Title
  \\node at (H.west -| Fe.north) [scale=2, font={\\sffamily\\Huge\\bfseries}]
    {Periodic Table of Elements};

\\end{tikzpicture}

\\end{document}
`,ie=`<?xml version="1.0" encoding="UTF-8"?>
<umlet_diagram>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>739</x>
      <y>16</y>
      <w>232</w>
      <h>264</h>
    </coordinates>
    <panel_attributes>lt=&lt;-
      when(spidersensor="rotate")
      /block spider
    </panel_attributes>
    <additional_attributes>161;244;161;34;71;34;71;74</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.FinalState</type>
    <coordinates>
      <x>890</x>
      <y>260</y>
      <w>20</w>
      <h>20</h>
    </coordinates>
    <panel_attributes></panel_attributes>
    <additional_attributes>transparentSelection=false</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>750</x>
      <y>170</y>
      <w>160</w>
      <h>137</h>
    </coordinates>
    <panel_attributes>lt=&lt;-
      after (10s)
      / block spider
    </panel_attributes>
    <additional_attributes>140;100;66;100;66;20</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.State</type>
    <coordinates>
      <x>340</x>
      <y>420</y>
      <w>100</w>
      <h>40</h>
    </coordinates>
    <panel_attributes>wait</panel_attributes>
    <additional_attributes>transparentSelection=false</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.HistoryState</type>
    <coordinates>
      <x>230</x>
      <y>440</y>
      <w>20</w>
      <h>20</h>
    </coordinates>
    <panel_attributes></panel_attributes>
    <additional_attributes>transparentSelection=false</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>230</x>
      <y>416</y>
      <w>130</w>
      <h>54</h>
    </coordinates>
    <panel_attributes>lt=&lt;-
      restart
    </panel_attributes>
    <additional_attributes>20;34;110;34</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>270</x>
      <y>396</y>
      <w>90</w>
      <h>54</h>
    </coordinates>
    <panel_attributes>lt=&lt;-
      pause
    </panel_attributes>
    <additional_attributes>70;34;20;34</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.FinalState</type>
    <coordinates>
      <x>90</x>
      <y>400</y>
      <w>20</w>
      <h>20</h>
    </coordinates>
    <panel_attributes></panel_attributes>
    <additional_attributes>transparentSelection=false</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>46</x>
      <y>256</y>
      <w>114</w>
      <h>164</h>
    </coordinates>
    <panel_attributes>lt=&lt;-
      after (10s)
      /timeout
    </panel_attributes>
    <additional_attributes>54;144;54;34;94;34</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>230</x>
      <y>110</y>
      <w>190</w>
      <h>170</h>
    </coordinates>
    <panel_attributes>lt=&lt;-
      timeout
    </panel_attributes>
    <additional_attributes>20;150;110;150;110;20;170;20</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.State</type>
    <coordinates>
      <x>700</x>
      <y>90</y>
      <w>180</w>
      <h>100</h>
    </coordinates>
    <panel_attributes>accept
      boarding pass
      --
      entry/ release card
      do/release spider
    </panel_attributes>
    <additional_attributes>transparentSelection=true</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>540</x>
      <y>140</y>
      <w>205</w>
      <h>100</h>
    </coordinates>
    <panel_attributes>lt=&lt;-
      [passenger booked]
    </panel_attributes>
    <additional_attributes>160;20;120;80;20;80</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>450</x>
      <y>210</y>
      <w>239</w>
      <h>190</h>
    </coordinates>
    <panel_attributes>lt=&lt;-
      [passenger not booked]
    </panel_attributes>
    <additional_attributes>219;170;99;170;99;20</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.State</type>
    <coordinates>
      <x>670</x>
      <y>350</y>
      <w>120</w>
      <h>50</h>
    </coordinates>
    <panel_attributes>reject
      boarding pass
    </panel_attributes>
    <additional_attributes>transparentSelection=false</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>480</x>
      <y>130</y>
      <w>142</w>
      <h>100</h>
    </coordinates>
    <panel_attributes>lt=&lt;-
      result of search
    </panel_attributes>
    <additional_attributes>71;80;71;20</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>270</x>
      <y>70</y>
      <w>150</w>
      <h>40</h>
    </coordinates>
    <panel_attributes>lt=&lt;-</panel_attributes>
    <additional_attributes>130;20;20;20</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.ThreeWayRelation</type>
    <coordinates>
      <x>540</x>
      <y>210</y>
      <w>20</w>
      <h>20</h>
    </coordinates>
    <panel_attributes></panel_attributes>
    <additional_attributes>transparentSelection=false</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.State</type>
    <coordinates>
      <x>140</x>
      <y>60</y>
      <w>150</w>
      <h>420</h>
    </coordinates>
    <panel_attributes>read boarding pass
      --
    </panel_attributes>
    <additional_attributes>transparentSelection=true</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.State</type>
    <coordinates>
      <x>400</x>
      <y>60</y>
      <w>180</w>
      <h>90</h>
    </coordinates>
    <panel_attributes>check passenger
      --
      entry/start search
      do/blink lamp
    </panel_attributes>
    <additional_attributes>transparentSelection=true</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.FinalState</type>
    <coordinates>
      <x>170</x>
      <y>410</y>
      <w>20</w>
      <h>20</h>
    </coordinates>
    <panel_attributes></panel_attributes>
    <additional_attributes>transparentSelection=false</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.State</type>
    <coordinates>
      <x>150</x>
      <y>240</y>
      <w>100</w>
      <h>40</h>
    </coordinates>
    <panel_attributes>read
      passenger ID
    </panel_attributes>
    <additional_attributes>transparentSelection=false</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.State</type>
    <coordinates>
      <x>150</x>
      <y>330</y>
      <w>100</w>
      <h>40</h>
    </coordinates>
    <panel_attributes>identify
      passenger
    </panel_attributes>
    <additional_attributes>transparentSelection=false</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>160</x>
      <y>260</y>
      <w>40</w>
      <h>90</h>
    </coordinates>
    <panel_attributes>lt=&lt;-</panel_attributes>
    <additional_attributes>20;70;20;20</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>160</x>
      <y>100</y>
      <w>40</w>
      <h>70</h>
    </coordinates>
    <panel_attributes>lt=&lt;-</panel_attributes>
    <additional_attributes>20;50;20;20</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>160</x>
      <y>350</y>
      <w>40</w>
      <h>80</h>
    </coordinates>
    <panel_attributes>lt=&lt;-</panel_attributes>
    <additional_attributes>20;60;20;20</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.base.Relation</type>
    <coordinates>
      <x>140</x>
      <y>170</y>
      <w>78</w>
      <h>90</h>
    </coordinates>
    <panel_attributes>lt=&lt;-
      [valid]
    </panel_attributes>
    <additional_attributes>39;70;39;20</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.State</type>
    <coordinates>
      <x>150</x>
      <y>150</y>
      <w>100</w>
      <h>40</h>
    </coordinates>
    <panel_attributes>check
      validity
    </panel_attributes>
    <additional_attributes>transparentSelection=false</additional_attributes>
  </element>
  <element>
    <type>com.umlet.element.custom.InitialState</type>
    <coordinates>
      <x>170</x>
      <y>100</y>
      <w>20</w>
      <h>20</h>
    </coordinates>
    <panel_attributes></panel_attributes>
    <additional_attributes>transparentSelection=false</additional_attributes>
  </element>
</umlet_diagram>
`,ae=`{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "width": 400,
  "height": 200,
  "padding": 5,

  "data": [
    {
      "name": "table",
      "values": [
        {"category": "A", "amount": 28},
        {"category": "B", "amount": 55},
        {"category": "C", "amount": 43},
        {"category": "D", "amount": 91},
        {"category": "E", "amount": 81},
        {"category": "F", "amount": 53},
        {"category": "G", "amount": 19},
        {"category": "H", "amount": 87}
      ]
    }
  ],

  "signals": [
    {
      "name": "tooltip",
      "value": {},
      "on": [
        {"events": "rect:mouseover", "update": "datum"},
        {"events": "rect:mouseout",  "update": "{}"}
      ]
    }
  ],

  "scales": [
    {
      "name": "xscale",
      "type": "band",
      "domain": {"data": "table", "field": "category"},
      "range": "width",
      "padding": 0.05,
      "round": true
    },
    {
      "name": "yscale",
      "domain": {"data": "table", "field": "amount"},
      "nice": true,
      "range": "height"
    }
  ],

  "axes": [
    { "orient": "bottom", "scale": "xscale" },
    { "orient": "left", "scale": "yscale" }
  ],

  "marks": [
    {
      "type": "rect",
      "from": {"data":"table"},
      "encode": {
        "enter": {
          "x": {"scale": "xscale", "field": "category"},
          "width": {"scale": "xscale", "band": 1},
          "y": {"scale": "yscale", "field": "amount"},
          "y2": {"scale": "yscale", "value": 0}
        },
        "update": {
          "fill": {"value": "steelblue"}
        },
        "hover": {
          "fill": {"value": "red"}
        }
      }
    },
    {
      "type": "text",
      "encode": {
        "enter": {
          "align": {"value": "center"},
          "baseline": {"value": "bottom"},
          "fill": {"value": "#333"}
        },
        "update": {
          "x": {"scale": "xscale", "signal": "tooltip.category", "band": 0.5},
          "y": {"scale": "yscale", "signal": "tooltip.amount", "offset": -2},
          "text": {"signal": "tooltip.amount"},
          "fillOpacity": [
            {"test": "datum === tooltip", "value": 0},
            {"value": 1}
          ]
        }
      }
    }
  ]
}
`,v=`{
  "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
  "description": "Horizontally concatenated charts that show different types of discretizing scales.",
  "data": {
    "values": [
      {"a": "A", "b": 28},
      {"a": "B", "b": 55},
      {"a": "C", "b": 43},
      {"a": "D", "b": 91},
      {"a": "E", "b": 81},
      {"a": "F", "b": 53},
      {"a": "G", "b": 19},
      {"a": "H", "b": 87},
      {"a": "I", "b": 52}
    ]
  },
  "hconcat": [
    {
      "mark": "circle",
      "encoding": {
        "y": {
          "field": "b",
          "type": "nominal",
          "sort": null,
          "axis": {
            "ticks": false,
            "domain": false,
            "title": null
          }
        },
        "size": {
          "field": "b",
          "type": "quantitative",
          "scale": {
            "type": "quantize"
          }
        },
        "color": {
          "field": "b",
          "type": "quantitative",
          "scale": {
            "type": "quantize",
            "zero": true
          },
          "legend": {
            "title": "Quantize"
          }
        }
      }
    },
    {
      "mark": "circle",
      "encoding": {
        "y": {
          "field": "b",
          "type": "nominal",
          "sort": null,
          "axis": {
            "ticks": false,
            "domain": false,
            "title": null
          }
        },
        "size": {
          "field": "b",
          "type": "quantitative",
          "scale": {
            "type": "quantile",
            "range": [80, 160, 240, 320, 400]
          }
        },
        "color": {
          "field": "b",
          "type": "quantitative",
          "scale": {
            "type": "quantile",
            "scheme": "magma"
          },
          "legend": {
            "format": "d",
            "title": "Quantile"
          }
        }
      }
    },
    {
      "mark": "circle",
      "encoding": {
        "y": {
          "field": "b",
          "type": "nominal",
          "sort": null,
          "axis": {
            "ticks": false,
            "domain": false,
            "title": null
          }
        },
        "size": {
          "field": "b",
          "type": "quantitative",
          "scale": {
            "type": "threshold",
            "domain": [30, 70],
            "range": [80, 200, 320]
          }
        },
        "color": {
          "field": "b",
          "type": "quantitative",
          "scale": {
            "type": "threshold",
            "domain": [30, 70],
            "scheme": "viridis"
          },
          "legend": {
            "title": "Threshold"
          }
        }
      }
    }
  ],
  "resolve": {
    "scale": {
      "color": "independent",
      "size": "independent"
    }
  }
}
`,oe=`{ signal: [
  { name: "clk",         wave: "p.....|..." },
  { name: "Data",        wave: "x.345x|=.x", data: ["head", "body", "tail", "data"] },
  { name: "Request",     wave: "0.1..0|1.0" },
  {},
  { name: "Acknowledge", wave: "1.....|01." }
]}
`,se=`connectors:
  X1:
    type: D-Sub
    subtype: female
    pinlabels: [DCD, RX, TX, DTR, GND, DSR, RTS, CTS, RI]
  X2:
    type: Molex KK 254
    subtype: female
    pinlabels: [GND, RX, TX]

cables:
  W1:
    gauge: 0.25 mm2
    length: 0.2
    color_code: DIN
    wirecount: 3
    shield: true

connections:
  -
    - X1: [5,2,3]
    - W1: [1,2,3]
    - X2: [1,3,2]
  -
    - X1: 5
    - W1: s
`;function ce(e){return e^e>>1}function le(e,t){let n=ce(e);return{meta:{title:n&1?t.title:``,description:n&2?t.description:``},presentation:{background:n&4?`#f4f4f4`:``,padding:n&8?24:0,frame:!!(n&16)}}}var ue=4,de=0,fe=1,pe=2;function y(e){let t=e.length;for(;--t>=0;)e[t]=0}var me=29,he=256,ge=286,_e=30,ve=19,ye=573,be=15,xe=16,Se=256,Ce=16,we=17,Te=18,Ee=new Uint8Array([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0]),De=new Uint8Array([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13]);new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7]);var Oe=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),ke=512,Ae=Array(576);y(Ae);var je=Array(_e*2);y(je);var Me=Array(ke);y(Me);var b=Array(256);y(b);var Ne=Array(me);y(Ne);var Pe=Array(_e);y(Pe);var x=e=>e<256?Me[e]:Me[256+(e>>>7)],S=(e,t)=>{e.pending_buf[e.pending++]=t&255,e.pending_buf[e.pending++]=t>>>8&255},C=(e,t,n)=>{e.bi_valid>xe-n?(e.bi_buf|=t<<e.bi_valid&65535,S(e,e.bi_buf),e.bi_buf=t>>xe-e.bi_valid,e.bi_valid+=n-xe):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=n)},w=(e,t,n)=>{C(e,n[t*2],n[t*2+1])},Fe=(e,t)=>{let n=0;do n|=e&1,e>>>=1,n<<=1;while(--t>0);return n>>>1},Ie=(e,t)=>{let n=t.dyn_tree,r=t.max_code,i=t.stat_desc.static_tree,a=t.stat_desc.has_stree,o=t.stat_desc.extra_bits,s=t.stat_desc.extra_base,c=t.stat_desc.max_length,l,u,d,f,p,m,h=0;for(f=0;f<=be;f++)e.bl_count[f]=0;for(n[e.heap[e.heap_max]*2+1]=0,l=e.heap_max+1;l<ye;l++)u=e.heap[l],f=n[n[u*2+1]*2+1]+1,f>c&&(f=c,h++),n[u*2+1]=f,!(u>r)&&(e.bl_count[f]++,p=0,u>=s&&(p=o[u-s]),m=n[u*2],e.opt_len+=m*(f+p),a&&(e.static_len+=m*(i[u*2+1]+p)));if(h!==0){do{for(f=c-1;e.bl_count[f]===0;)f--;e.bl_count[f]--,e.bl_count[f+1]+=2,e.bl_count[c]--,h-=2}while(h>0);for(f=c;f!==0;f--)for(u=e.bl_count[f];u!==0;)d=e.heap[--l],!(d>r)&&(n[d*2+1]!==f&&(e.opt_len+=(f-n[d*2+1])*n[d*2],n[d*2+1]=f),u--)}},Le=(e,t,n)=>{let r=Array(16),i=0,a,o;for(a=1;a<=be;a++)i=i+n[a-1]<<1,r[a]=i;for(o=0;o<=t;o++){let t=e[o*2+1];t!==0&&(e[o*2]=Fe(r[t]++,t))}},Re=e=>{let t;for(t=0;t<ge;t++)e.dyn_ltree[t*2]=0;for(t=0;t<_e;t++)e.dyn_dtree[t*2]=0;for(t=0;t<ve;t++)e.bl_tree[t*2]=0;e.dyn_ltree[Se*2]=1,e.opt_len=e.static_len=0,e.sym_next=e.matches=0},ze=e=>{e.bi_valid>8?S(e,e.bi_buf):e.bi_valid>0&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0},Be=(e,t,n,r)=>{let i=t*2,a=n*2;return e[i]<e[a]||e[i]===e[a]&&r[t]<=r[n]},T=(e,t,n)=>{let r=e.heap[n],i=n<<1;for(;i<=e.heap_len&&(i<e.heap_len&&Be(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!Be(t,r,e.heap[i],e.depth));)e.heap[n]=e.heap[i],n=i,i<<=1;e.heap[n]=r},Ve=(e,t,n)=>{let r,i,a=0,o,s;if(e.sym_next!==0)do r=e.pending_buf[e.sym_buf+a++]&255,r+=(e.pending_buf[e.sym_buf+a++]&255)<<8,i=e.pending_buf[e.sym_buf+a++],r===0?w(e,i,t):(o=b[i],w(e,o+he+1,t),s=Ee[o],s!==0&&(i-=Ne[o],C(e,i,s)),r--,o=x(r),w(e,o,n),s=De[o],s!==0&&(r-=Pe[o],C(e,r,s)));while(a<e.sym_next);w(e,Se,t)},He=(e,t)=>{let n=t.dyn_tree,r=t.stat_desc.static_tree,i=t.stat_desc.has_stree,a=t.stat_desc.elems,o,s,c=-1,l;for(e.heap_len=0,e.heap_max=ye,o=0;o<a;o++)n[o*2]===0?n[o*2+1]=0:(e.heap[++e.heap_len]=c=o,e.depth[o]=0);for(;e.heap_len<2;)l=e.heap[++e.heap_len]=c<2?++c:0,n[l*2]=1,e.depth[l]=0,e.opt_len--,i&&(e.static_len-=r[l*2+1]);for(t.max_code=c,o=e.heap_len>>1;o>=1;o--)T(e,n,o);l=a;do o=e.heap[1],e.heap[1]=e.heap[e.heap_len--],T(e,n,1),s=e.heap[1],e.heap[--e.heap_max]=o,e.heap[--e.heap_max]=s,n[l*2]=n[o*2]+n[s*2],e.depth[l]=(e.depth[o]>=e.depth[s]?e.depth[o]:e.depth[s])+1,n[o*2+1]=n[s*2+1]=l,e.heap[1]=l++,T(e,n,1);while(e.heap_len>=2);e.heap[--e.heap_max]=e.heap[1],Ie(e,t),Le(n,c,e.bl_count)},Ue=(e,t,n)=>{let r,i=-1,a,o=t[1],s=0,c=7,l=4;for(o===0&&(c=138,l=3),t[(n+1)*2+1]=65535,r=0;r<=n;r++)a=o,o=t[(r+1)*2+1],!(++s<c&&a===o)&&(s<l?e.bl_tree[a*2]+=s:a===0?s<=10?e.bl_tree[34]++:e.bl_tree[36]++:(a!==i&&e.bl_tree[a*2]++,e.bl_tree[32]++),s=0,i=a,o===0?(c=138,l=3):a===o?(c=6,l=3):(c=7,l=4))},We=(e,t,n)=>{let r,i=-1,a,o=t[1],s=0,c=7,l=4;for(o===0&&(c=138,l=3),r=0;r<=n;r++)if(a=o,o=t[(r+1)*2+1],!(++s<c&&a===o)){if(s<l)do w(e,a,e.bl_tree);while(--s!==0);else a===0?s<=10?(w(e,we,e.bl_tree),C(e,s-3,3)):(w(e,Te,e.bl_tree),C(e,s-11,7)):(a!==i&&(w(e,a,e.bl_tree),s--),w(e,Ce,e.bl_tree),C(e,s-3,2));s=0,i=a,o===0?(c=138,l=3):a===o?(c=6,l=3):(c=7,l=4)}},Ge=e=>{let t;for(Ue(e,e.dyn_ltree,e.l_desc.max_code),Ue(e,e.dyn_dtree,e.d_desc.max_code),He(e,e.bl_desc),t=18;t>=3&&e.bl_tree[Oe[t]*2+1]===0;t--);return e.opt_len+=3*(t+1)+5+5+4,t},Ke=(e,t,n,r)=>{let i;for(C(e,t-257,5),C(e,n-1,5),C(e,r-4,4),i=0;i<r;i++)C(e,e.bl_tree[Oe[i]*2+1],3);We(e,e.dyn_ltree,t-1),We(e,e.dyn_dtree,n-1)},qe=e=>{let t=4093624447,n;for(n=0;n<=31;n++,t>>>=1)if(t&1&&e.dyn_ltree[n*2]!==0)return de;if(e.dyn_ltree[18]!==0||e.dyn_ltree[20]!==0||e.dyn_ltree[26]!==0)return fe;for(n=32;n<he;n++)if(e.dyn_ltree[n*2]!==0)return fe;return de},E=(e,t,n,r)=>{C(e,0+ +!!r,3),ze(e),S(e,n),S(e,~n),n&&e.pending_buf.set(e.window.subarray(t,t+n),e.pending),e.pending+=n},Je=(e,t,n,r)=>{let i,a,o=0;e.level>0?(e.strm.data_type===pe&&(e.strm.data_type=qe(e)),He(e,e.l_desc),He(e,e.d_desc),o=Ge(e),i=e.opt_len+3+7>>>3,a=e.static_len+3+7>>>3,a<=i&&(i=a)):i=a=n+5,n+4<=i&&t!==-1?E(e,t,n,r):e.strategy===ue||a===i?(C(e,2+ +!!r,3),Ve(e,Ae,je)):(C(e,4+ +!!r,3),Ke(e,e.l_desc.max_code+1,e.d_desc.max_code+1,o+1),Ve(e,e.dyn_ltree,e.dyn_dtree)),Re(e),r&&ze(e)},D=(e,t,n)=>(e.pending_buf[e.sym_buf+e.sym_next++]=t,e.pending_buf[e.sym_buf+e.sym_next++]=t>>8,e.pending_buf[e.sym_buf+e.sym_next++]=n,t===0?e.dyn_ltree[n*2]++:(e.matches++,t--,e.dyn_ltree[(b[n]+he+1)*2]++,e.dyn_dtree[x(t)*2]++),e.sym_next===e.sym_end),O=(e,t,n,r)=>{let i=e&65535|0,a=e>>>16&65535|0,o=0;for(;n!==0;){o=n>2e3?2e3:n,n-=o;do i=i+t[r++]|0,a=a+i|0;while(--o);i%=65521,a%=65521}return i|a<<16|0},k=new Uint32Array((()=>{let e,t=[];for(var n=0;n<256;n++){e=n;for(var r=0;r<8;r++)e=e&1?3988292384^e>>>1:e>>>1;t[n]=e}return t})()),A=(e,t,n,r)=>{let i=k,a=r+n;e^=-1;for(let n=r;n<a;n++)e=e>>>8^i[(e^t[n])&255];return e^-1},j=3,M=258,N=262,P=1,F=2,Ye=3,Xe=4,Ze=e=>{let t,n,r,i=e.w_size;t=e.hash_size,r=t;do n=e.head[--r],e.head[r]=n>=i?n-i:0;while(--t);t=i,r=t;do n=e.prev[--r],e.prev[r]=n>=i?n-i:0;while(--t)},Qe=(e,t,n)=>(t<<e.hash_shift^n)&e.hash_mask,I=(e,t)=>{let n;if(e.legacy_hash)n=e.ins_h=Qe(e,e.ins_h,e.window[t+j-1]);else{let r=e.window,i=r[t]|r[t+1]<<8|r[t+2]<<16|r[t+3]<<24;n=e.ins_h=Math.imul(i,66521)+66521>>>16&e.hash_mask}let r=e.prev[t&e.w_mask]=e.head[n];return e.head[n]=t,r},$e=e=>{let t=e.state,n=t.pending;n>e.avail_out&&(n=e.avail_out),n!==0&&(e.output.set(t.pending_buf.subarray(t.pending_out,t.pending_out+n),e.next_out),e.next_out+=n,t.pending_out+=n,e.total_out+=n,e.avail_out-=n,t.pending-=n,t.pending===0&&(t.pending_out=0))},L=(e,t)=>{Je(e,e.block_start>=0?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,$e(e.strm)},et=(e,t,n,r)=>{let i=e.avail_in;return i>r&&(i=r),i===0?0:(e.avail_in-=i,t.set(e.input.subarray(e.next_in,e.next_in+i),n),e.state.wrap===1?e.adler=O(e.adler,t,i,n):e.state.wrap===2&&(e.adler=A(e.adler,t,i,n)),e.next_in+=i,e.total_in+=i,i)},tt=(e,t)=>{let n=e.max_chain_length,r=e.strstart,i,a,o=e.prev_length,s=e.nice_match,c=e.strstart>e.w_size-N?e.strstart-(e.w_size-N):0,l=e.window,u=e.w_mask,d=e.prev,f=e.strstart+M,p=l[r+o-1],m=l[r+o];e.prev_length>=e.good_match&&(n>>=2),s>e.lookahead&&(s=e.lookahead);do if(i=t,l[i+o]===m&&l[i+o-1]===p&&l[i]===l[r]&&l[++i]===l[r+1]){r+=2,i++;do;while(l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&r<f);if(a=M-(f-r),r=f-M,a>o){if(e.match_start=t,o=a,a>=s)break;p=l[r+o-1],m=l[r+o]}}while((t=d[t&u])>c&&--n!==0);return o<=e.lookahead?o:e.lookahead},R=e=>{let t=e.w_size,n,r,i;do{if(r=e.window_size-e.lookahead-e.strstart,e.strstart>=t+(t-N)&&(e.window.set(e.window.subarray(t,t+t-r),0),e.match_start-=t,e.strstart-=t,e.block_start-=t,e.insert>e.strstart&&(e.insert=e.strstart),Ze(e),r+=t),e.strm.avail_in===0)break;if(n=et(e.strm,e.window,e.strstart+e.lookahead,r),e.lookahead+=n,!e.legacy_hash){if(e.lookahead+e.insert>j)for(i=e.strstart-e.insert;e.insert&&(I(e,i),i++,e.insert--,!(e.lookahead+e.insert<=j)););}else if(e.lookahead+e.insert>=j)for(i=e.strstart-e.insert,e.ins_h=e.window[i],e.ins_h=Qe(e,e.ins_h,e.window[i+1]);e.insert&&(I(e,i),i++,e.insert--,!(e.lookahead+e.insert<j)););}while(e.lookahead<N&&e.strm.avail_in!==0)},nt=(e,t)=>{let n=e.pending_buf_size-5>e.w_size?e.w_size:e.pending_buf_size-5,r,i,a,o=0,s=e.strm.avail_in;do{if(r=65535,a=e.bi_valid+42>>3,e.strm.avail_out<a||(a=e.strm.avail_out-a,i=e.strstart-e.block_start,r>i+e.strm.avail_in&&(r=i+e.strm.avail_in),r>a&&(r=a),r<n&&(r===0&&t!==4||t===0||r!==i+e.strm.avail_in)))break;o=+(t===4&&r===i+e.strm.avail_in),E(e,0,0,o),e.pending_buf[e.pending-4]=r,e.pending_buf[e.pending-3]=r>>8,e.pending_buf[e.pending-2]=~r,e.pending_buf[e.pending-1]=~r>>8,$e(e.strm),i&&(i>r&&(i=r),e.strm.output.set(e.window.subarray(e.block_start,e.block_start+i),e.strm.next_out),e.strm.next_out+=i,e.strm.avail_out-=i,e.strm.total_out+=i,e.block_start+=i,r-=i),r&&(et(e.strm,e.strm.output,e.strm.next_out,r),e.strm.next_out+=r,e.strm.avail_out-=r,e.strm.total_out+=r)}while(o===0);return s-=e.strm.avail_in,s&&(s>=e.w_size?(e.matches=2,e.window.set(e.strm.input.subarray(e.strm.next_in-e.w_size,e.strm.next_in),0),e.strstart=e.w_size,e.insert=e.strstart):(e.window_size-e.strstart<=s&&(e.strstart-=e.w_size,e.window.set(e.window.subarray(e.w_size,e.w_size+e.strstart),0),e.matches<2&&e.matches++,e.insert>e.strstart&&(e.insert=e.strstart)),e.window.set(e.strm.input.subarray(e.strm.next_in-s,e.strm.next_in),e.strstart),e.strstart+=s,e.insert+=s>e.w_size-e.insert?e.w_size-e.insert:s),e.block_start=e.strstart),e.high_water<e.strstart&&(e.high_water=e.strstart),o?Xe:t!==0&&t!==4&&e.strm.avail_in===0&&e.strstart===e.block_start?F:(a=e.window_size-e.strstart,e.strm.avail_in>a&&e.block_start>=e.w_size&&(e.block_start-=e.w_size,e.strstart-=e.w_size,e.window.set(e.window.subarray(e.w_size,e.w_size+e.strstart),0),e.matches<2&&e.matches++,a+=e.w_size,e.insert>e.strstart&&(e.insert=e.strstart)),a>e.strm.avail_in&&(a=e.strm.avail_in),a&&(et(e.strm,e.window,e.strstart,a),e.strstart+=a,e.insert+=a>e.w_size-e.insert?e.w_size-e.insert:a),e.high_water<e.strstart&&(e.high_water=e.strstart),a=e.bi_valid+42>>3,a=e.pending_buf_size-a>65535?65535:e.pending_buf_size-a,n=a>e.w_size?e.w_size:a,i=e.strstart-e.block_start,(i>=n||(i||t===4)&&t!==0&&e.strm.avail_in===0&&i<=a)&&(r=i>a?a:i,o=+(t===4&&e.strm.avail_in===0&&r===i),E(e,e.block_start,r,o),e.block_start+=r,$e(e.strm)),o?Ye:P)},rt=(e,t)=>{let n,r;for(;;){if(e.lookahead<N){if(R(e),e.lookahead<N&&t===0)return P;if(e.lookahead===0)break}if(n=0,e.lookahead>=j&&(n=I(e,e.strstart)),n!==0&&e.strstart-n<=e.w_size-N&&(e.match_length=tt(e,n)),e.match_length>=j){if(r=D(e,e.strstart-e.match_start,e.match_length-j),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=j){e.match_length--;do e.strstart++,n=I(e,e.strstart);while(--e.match_length!==0);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.legacy_hash&&(e.ins_h=e.window[e.strstart],e.ins_h=Qe(e,e.ins_h,e.window[e.strstart+1]))}else r=D(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(r&&(L(e,!1),e.strm.avail_out===0))return P}return e.insert=e.strstart<j-1?e.strstart:j-1,t===4?(L(e,!0),e.strm.avail_out===0?Ye:Xe):e.sym_next&&(L(e,!1),e.strm.avail_out===0)?P:F},z=(e,t)=>{let n,r,i;for(;;){if(e.lookahead<N){if(R(e),e.lookahead<N&&t===0)return P;if(e.lookahead===0)break}if(n=0,e.lookahead>=j&&(n=I(e,e.strstart)),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=j-1,n!==0&&e.prev_length<e.max_lazy_match&&e.strstart-n<=e.w_size-N&&(e.match_length=tt(e,n),e.match_length<=5&&(e.strategy===1||e.match_length===j&&e.strstart-e.match_start>4096)&&(e.match_length=j-1)),e.prev_length>=j&&e.match_length<=e.prev_length){i=e.strstart+e.lookahead-j,r=D(e,e.strstart-1-e.prev_match,e.prev_length-j),e.lookahead-=e.prev_length-1,e.prev_length-=2;do++e.strstart<=i&&(n=I(e,e.strstart));while(--e.prev_length!==0);if(e.match_available=0,e.match_length=j-1,e.strstart++,r&&(L(e,!1),e.strm.avail_out===0))return P}else if(e.match_available){if(r=D(e,0,e.window[e.strstart-1]),r&&L(e,!1),e.strstart++,e.lookahead--,e.strm.avail_out===0)return P}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&=(r=D(e,0,e.window[e.strstart-1]),0),e.insert=e.strstart<j-1?e.strstart:j-1,t===4?(L(e,!0),e.strm.avail_out===0?Ye:Xe):e.sym_next&&(L(e,!1),e.strm.avail_out===0)?P:F},B=class{constructor(e,t,n,r,i){this.good_length=e,this.max_lazy=t,this.nice_length=n,this.max_chain=r,this.func=i}};new B(0,0,0,0,nt),new B(4,4,8,4,rt),new B(4,5,16,8,rt),new B(4,6,32,32,rt),new B(4,4,16,16,z),new B(8,16,32,32,z),new B(8,16,128,128,z),new B(8,32,128,256,z),new B(32,128,258,1024,z),new B(32,258,258,4096,z),new Uint16Array([3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0]),new Uint8Array([16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,199,75]),new Uint16Array([1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0]),new Uint8Array([16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64]);var it=`plantuml`,at=`@startuml
skinparam monochrome true
skinparam shadowing false

actor Alice
participant "Alice Agent" as AliceAgent
participant "Tandem App" as Tandem
participant "Bob Agent" as BobAgent
actor Bob

Alice -> AliceAgent: Describe a shared to-do app
AliceAgent -> Tandem: Draft the task flow
Bob -> BobAgent: Build and test the API
BobAgent -> Tandem: Ship task sync
Alice -> Tandem: Add "Buy paint"
Tandem -> Bob: Share the new task
Bob -> Tandem: Mark it done
Tandem --> Alice: Everyone is in sync
@enduml`;new TextEncoder,new TextDecoder;function V(e={}){if(typeof e!=`object`||!e||Array.isArray(e))throw Error(`Invalid diagram metadata.`);let t=e.title??``,n=e.description??``;if(typeof t!=`string`||typeof n!=`string`)throw Error(`Invalid diagram metadata.`);return{title:t,description:n}}function H(e={}){if(typeof e!=`object`||!e||Array.isArray(e))throw Error(`Invalid diagram presentation.`);let t=e.background??``,n=e.padding??0,r=e.frame??!1;if(typeof t!=`string`||t&&!/^#[0-9a-f]{6}$/i.test(t)||!Number.isInteger(n)||n<0||n>256||typeof r!=`boolean`)throw Error(`Invalid diagram presentation.`);return{background:t,padding:n,frame:r}}var ot={plantuml:at,mermaid:`flowchart LR
  Alice([Alice]) -->|describes the shared list| AliceAgent["Alice Agent"]
  AliceAgent -->|drafts the experience| Tandem["Tandem App"]
  Bob([Bob]) -->|reviews the plan| BobAgent["Bob Agent"]
  BobAgent -->|builds and tests the API| Tandem
  Tandem -->|keeps tasks in sync| Alice
  Tandem -->|keeps tasks in sync| Bob`,graphviz:`digraph Tandem {
  rankdir=LR
  node [shape=box, style="rounded,filled", fillcolor="#eef2ff"]
  Alice [shape=oval, fillcolor="#fef3c7"]
  Bob [shape=oval, fillcolor="#dcfce7"]
  AliceAgent [label="Alice Agent"]
  BobAgent [label="Bob Agent"]
  Tandem [label="Tandem App", fillcolor="#ddd6fe"]
  Alice -> AliceAgent [label="shares an idea"]
  AliceAgent -> Tandem [label="proposes the flow"]
  Bob -> BobAgent [label="asks for an API"]
  BobAgent -> Tandem [label="ships + tests"]
  Tandem -> { Alice Bob } [label="syncs tasks"]
}`,c4plantuml:`@startuml
!include <C4/C4_Context>

Person(alice, "Alice", "Plans the product and creates shared tasks")
Person(bob, "Bob", "Builds the app and completes shared tasks")
System(aliceAgent, "Alice Agent", "Turns Alice's ideas into product flows")
System(bobAgent, "Bob Agent", "Implements and tests Bob's changes")
System(tandem, "Tandem App", "A tiny shared to-do list")

Rel(alice, aliceAgent, "Explains what friends need")
Rel(aliceAgent, tandem, "Proposes task flows")
Rel(bob, bobAgent, "Requests implementation help")
Rel(bobAgent, tandem, "Builds and verifies")
Rel(alice, tandem, "Creates tasks")
Rel(bob, tandem, "Completes tasks")
@enduml`,blockdiag:`blockdiag {
  orientation = portrait
  Alice -> "Alice Agent" -> "Tandem App";
  Bob -> "Bob Agent" -> "Tandem App";
  "Tandem App" -> "Shared task list";

  Alice [color = "#fde68a"];
  Bob [color = "#bbf7d0"];
  "Alice Agent" [color = "#bfdbfe"];
  "Bob Agent" [color = "#bfdbfe"];
  "Tandem App" [color = "#ddd6fe"];
  "Shared task list" [color = "#fecdd3"];
}`,seqdiag:`seqdiag {
  Alice; "Alice Agent"; "Tandem App"; "Bob Agent"; Bob;
  Alice -> "Alice Agent" [label = "Sketch our shared errands"];
  "Alice Agent" -> "Tandem App" [label = "Create task: Buy paint"];
  "Tandem App" -> "Bob Agent" [label = "Task assigned to Bob"];
  "Bob Agent" -> Bob [label = "Offer a reminder"];
  Bob -> "Tandem App" [label = "Mark task complete"];
  "Tandem App" -> Alice [label = "List synced"];
}`,actdiag:`actdiag {
  describe -> shape -> implement -> verify -> share

  lane Alice {
    label = "Alice"
    describe [label = "Describe shared tasks"];
    share [label = "Try Tandem with Bob"];
  }
  lane "Alice Agent" {
    shape [label = "Shape the task flow"];
  }
  lane "Bob Agent" {
    implement [label = "Build Tandem"];
    verify [label = "Test task sync"];
  }
}`,structurizr:`workspace "Tandem" "Alice and Bob build a shared to-do app with their agents" {
  model {
    alice = person "Alice" "Plans Tandem and creates tasks"
    bob = person "Bob" "Builds Tandem and completes tasks"
    aliceAgent = softwareSystem "Alice Agent" "Shapes Alice's ideas into product flows"
    bobAgent = softwareSystem "Bob Agent" "Implements and tests Bob's changes"
    tandem = softwareSystem "Tandem App" "Keeps Alice and Bob's tasks in sync"

    alice -> aliceAgent "Describes the experience"
    aliceAgent -> tandem "Proposes task flows"
    bob -> bobAgent "Requests implementation help"
    bobAgent -> tandem "Builds and tests"
    alice -> tandem "Creates tasks"
    bob -> tandem "Completes tasks"
  }
  views {
    systemLandscape "TandemLandscape" {
      include *
      autolayout lr
    }
    theme default
  }
}`,ditaa:`+-------------+                       +-------------+
|             |                       |             |
|    Alice    |                       |     Bob     |
|             |                       |             |
+------+------+                       +------+------+
       | product idea                        | implementation
       v                                     v
+------+------+                       +------+------+
|             |                       |             |
| Alice Agent |                       |  Bob Agent  |
|             |                       |             |
+------+------+                       +------+------+
       | task flow                           | tested build
       |                                     |
       +------------------+   +--------------+
                          |   |
                          v   v
                   +------+---+------+
                   |                 |
                   |   Tandem App    |
                   |                 |
                   +--------+--------+
                            |
                            | persist and sync
                            v
                   +--------+--------+
                   |  Shared Tasks   |
                   |      {s}        |
                   +-----------------+`,d2:c,nwdiag:h,packetdiag:ee,rackdiag:g,bpmn:o.replaceAll(`Examine Situation`,`Bob Agent tests Tandem`).replaceAll(`Things OK?`,`Tests pass?`).replaceAll(`Notification Sent`,`Alice and Bob share tasks`).replaceAll(`Error Propagated`,`Alice Agent revises flow`).replaceAll(`Klaus`,`Alice`).replaceAll(`Walter`,`Bob`),bytefield:s,dbml:l,diagramsnet:u,erd:d,excalidraw:f,goat:p,nomnoml:m,pikchr:te,svgbob:_,symbolator:ne,tikz:re,umlet:ie,vega:ae,vegalite:v,wavedrom:oe,wireviz:se},st={plantuml:[`Tandem task sync`,`Alice and Bob coordinate shared tasks through their agents.`],mermaid:[`Shared task flow`,`A compact view of ideas moving through the Tandem team.`],graphviz:[`Tandem collaboration graph`,`People and agents converge on one synchronized task list.`],d2:[`Connection styles`,`D2 connection, arrowhead, shape, and animation syntax.`],c4plantuml:[`Tandem system context`,`The people and software systems surrounding Tandem.`],blockdiag:[`Tandem block flow`,`A block-oriented view of the shared task workflow.`],seqdiag:[`Tandem task sequence`,`A task moves from Alice to Bob and back through Tandem.`],actdiag:[`Tandem delivery activities`,`Work crosses Alice, Alice Agent, and Bob Agent lanes.`],nwdiag:[`Network layout`,`A sample network topology and its connected address ranges.`],packetdiag:[`TCP packet structure`,`The bit-level layout of a TCP packet header.`],rackdiag:[`Rack layout`,`A sample equipment rack rendered from rackdiag syntax.`],bpmn:[`Agent-assisted review`,`A BPMN review flow that branches on test results.`],bytefield:[`Byte field layout`,`A compact byte-oriented protocol field example.`],dbml:[`Database schema`,`Tables and relationships expressed with DBML.`],diagramsnet:[`Venn diagram`,`An overlapping-set example imported from diagrams.net.`],ditaa:[`Tandem ASCII architecture`,`An ASCII sketch becomes a rendered system diagram.`],erd:[`Data model`,`Entities and relationships in a small relational schema.`],excalidraw:[`Venn sketch`,`A hand-drawn overlapping-set diagram.`],goat:[`Component shapes`,`GoAT exercises boxes, connectors, curves, and symbols.`],nomnoml:[`Pirate class diagram`,`A playful class diagram demonstrating Nomnoml syntax.`],pikchr:[`Cardinal points`,`A diamond marks north, east, south, and west.`],structurizr:[`Tandem landscape`,`A software landscape linking people, agents, and Tandem.`],svgbob:[`Cloud network`,`An ASCII cloud connects clients and services.`],symbolator:[`Hardware component`,`A component symbol generated from interface declarations.`],tikz:[`Periodic table`,`A color-coded periodic table rendered with TikZ.`],umlet:[`UML example`,`A UMLet document rendered directly from its XML form.`],vega:[`Bar chart`,`A declarative bar chart expressed with Vega.`],vegalite:[`Discretizing scale`,`A Vega-Lite example comparing discretized values.`],wavedrom:[`Timing diagram`,`Digital signals and timing relationships rendered by WaveDrom.`],wireviz:[`Wiring harness`,`Connections, cables, and pins described with WireViz.`]};function ct(e){return ot[e]??at}function lt(e){let t=n.findIndex(t=>t.id===e),[r,i]=st[e]??[`Diagram example`,`A diagram.zip catalog example.`];return{type:e,source:ct(e),options:{},...le(Math.max(t,0),{title:r,description:i})}}function ut({search:e=globalThis.location?.search??``,coarsePointer:t=globalThis.matchMedia?.(`(pointer: coarse)`).matches??!1}={}){let n=new URLSearchParams(e).get(`editor`);return n===`textarea`||n===`monaco`?n:t?`textarea`:`monaco`}async function dt(e){let t=ut();try{return await ft(t,e)}catch(n){if(t===`textarea`)throw n;return console.warn(`Monaco Editor is unavailable; using the basic text editor.`,n),ft(`textarea`,e)}}async function ft(e,n){let r=await(e===`textarea`?await t(()=>import(`./textarea-editor-BTXrLHn4.js`),[]):await t(()=>import(`./monaco-editor-C7iaFm9N.js`),__vite__mapDeps([0,1,2,3,4,5]))).createEditor(n);return n.element.dataset.editorBackend=e,r}function pt(e,t,n,r,i){return e.set(t,{...r,type:t}),e.get(n)??i(n)}var mt=`/api/v1`,U=/^[A-Za-z0-9_-]{16}$/,ht=/^[A-Za-z0-9_-]{43}$/;function gt(e){let t=``;for(let n of e)t+=String.fromCharCode(n);return btoa(t).replaceAll(`+`,`-`).replaceAll(`/`,`_`).replace(/=+$/,``)}function _t(){return gt(crypto.getRandomValues(new Uint8Array(32)))}function vt(e){return e.match(/^\/d\/([A-Za-z0-9_-]{16})\/?$/)?.[1]??null}function yt(e,t){if(!U.test(t))throw Error(`Invalid diagram alias.`);return new URL(`/d/${t}`,e).toString()}function bt(e,t,n){if(!ht.test(n))throw Error(`Invalid write capability.`);let r=new URL(yt(e,t));return r.hash=`w=${n}`,r.toString()}function xt(e,t,n=`svg`){if(!U.test(t))throw Error(`Invalid diagram alias.`);if(n!==`svg`&&n!==`png`)throw Error(`Invalid render format.`);return new URL(`${mt}/aliases/${t}/renders/${n}`,e).toString()}function St(e){return e.match(/^#w=([A-Za-z0-9_-]{43})$/)?.[1]??null}var Ct=class extends Error{constructor(e,{status:t,code:n}={}){super(e),this.status=t,this.code=n}};function wt(e){if(!e||typeof e!=`object`||typeof e.type!=`string`||typeof e.source!=`string`)throw Error(`Invalid diagram state.`);return{mode:`open`,diagram:{type:e.type,source:e.source,options:e.options??{},presentation:H(e.presentation)},metadata:V(e.meta)}}function Tt(e){if(!e||typeof e!=`object`||!U.test(e.aliasId)||!ht.test(e.contentId)||!ht.test(e.renderId)||!Number.isSafeInteger(e.revision)||e.mode!==`open`&&e.mode!==`locked`)throw new Ct(`The persistence service returned an invalid response.`,{code:`invalid_response`});let t={aliasId:e.aliasId,contentId:e.contentId,renderId:e.renderId,revision:e.revision,mode:e.mode,createdAt:e.createdAt,updatedAt:e.updatedAt};if(e.mode===`locked`){if(!e.encryptedContent||!e.encryptedMetadata||!e.keyEnvelope)throw new Ct(`The persistence service returned an invalid locked diagram.`,{code:`invalid_response`});return{...t,encryptedContent:e.encryptedContent,encryptedMetadata:e.encryptedMetadata,keyEnvelope:e.keyEnvelope}}if(!e.diagram||typeof e.diagram!=`object`)throw new Ct(`The persistence service returned an invalid open diagram.`,{code:`invalid_response`});return{...t,state:{type:e.diagram.type,source:e.diagram.source,options:e.diagram.options??{},presentation:H(e.diagram.presentation),meta:V(e.metadata)}}}var Et=class{constructor({fetchImpl:e=globalThis.fetch,origin:t=globalThis.location?.origin??`http://localhost`,apiPrefix:n=mt}={}){this.fetch=(...t)=>e(...t),this.origin=t,this.apiPrefix=n.replace(/\/$/,``)}url(e=``){return new URL(`${this.apiPrefix}/aliases${e}`,this.origin)}async request(e,t){let n=await this.fetch(e,t),r=await n.json().catch(()=>null);if(!n.ok)throw new Ct(r?.error?.message||`Persistence request failed with HTTP ${n.status}.`,{status:n.status,code:r?.error?.code});return Tt(r)}async errorFor(e){let t=await e.json().catch(()=>null);return new Ct(t?.error?.message||`Persistence request failed with HTTP ${e.status}.`,{status:e.status,code:t?.error?.code})}async createPayload(e){let t=_t();return{...await this.request(this.url(),{method:`POST`,headers:{Authorization:`Bearer ${t}`,"Content-Type":`application/json`},body:JSON.stringify(e)}),writeCapability:t}}createAlias(e){return this.createPayload(wt(e))}createLockedAlias(e){if(e?.mode!==`locked`)throw Error(`Invalid locked diagram payload.`);return this.createPayload(e)}getAlias(e){if(!U.test(e))throw Error(`Invalid diagram alias.`);return this.request(this.url(`/${e}`),{headers:{Accept:`application/json`}})}updatePayload(e,t,n,r){if(!U.test(e))throw Error(`Invalid diagram alias.`);if(!Number.isSafeInteger(n)||n<1)throw Error(`Invalid alias revision.`);if(!ht.test(r))throw Error(`Invalid write capability.`);return this.request(this.url(`/${e}`),{method:`PUT`,headers:{Accept:`application/json`,Authorization:`Bearer ${r}`,"Content-Type":`application/json`,"If-Match":`"${n}"`},body:JSON.stringify(t)})}updateAlias(e,t,n,r){return this.updatePayload(e,wt(t),n,r)}updateLockedAlias(e,t,n,r){if(t?.mode!==`locked`)throw Error(`Invalid locked diagram payload.`);return this.updatePayload(e,t,n,r)}async uploadRender({aliasId:e,renderId:t,revision:n,writeCapability:r,format:i,mode:a,render:o,renderer:s}){if(!U.test(e))throw Error(`Invalid diagram alias.`);if(!ht.test(t))throw Error(`Invalid render ID.`);if(!Number.isSafeInteger(n)||n<1)throw Error(`Invalid alias revision.`);if(!ht.test(r))throw Error(`Invalid write capability.`);if(i!==`svg`&&i!==`png`)throw Error(`Invalid render format.`);if(a!==`open`&&a!==`locked`)throw Error(`Invalid diagram mode.`);if(!s||!/^[a-z][a-z0-9-]{0,31}$/.test(s.unit)||typeof s.build!=`string`||!/^[A-Za-z0-9][A-Za-z0-9._@+-]{0,127}$/.test(s.build)||!Array.isArray(s.pipeline)||s.pipeline.length<1||s.pipeline.some(e=>!/^[a-z][a-z0-9-]{0,31}$/.test(e)))throw Error(`Invalid renderer identity.`);let c=a===`locked`?`application/json`:i===`svg`?`image/svg+xml`:`image/png`,l=a===`locked`?JSON.stringify(o):o,u=await this.fetch(this.url(`/${e}/renders/${i}`),{method:`PUT`,headers:{Authorization:`Bearer ${r}`,"Content-Type":c,"If-Match":`"${n}"`,"X-Render-Id":t,"X-Renderer-Unit":s.unit,"X-Renderer-Build":s.build,"X-Renderer-Pipeline":s.pipeline.join(`,`)},body:l});if(!u.ok)throw await this.errorFor(u)}async getEncryptedRender(e,t){if(!U.test(e))throw Error(`Invalid diagram alias.`);if(t!==`svg`&&t!==`png`)throw Error(`Invalid render format.`);let n=this.url(`/${e}/renders/${t}`);n.searchParams.set(`encrypted`,`1`);let r=await this.fetch(n,{headers:{Accept:`application/json`}});if(!r.ok)throw await this.errorFor(r);return r.json()}},Dt=6e5,Ot=new TextEncoder,kt=new TextDecoder,At=Ot.encode(`diagram.zip:content:v1`),jt=Ot.encode(`diagram.zip:metadata:v1`),Mt=Ot.encode(`diagram.zip:bundle-key:v1`);function Nt(e){if(e!==`svg`&&e!==`png`)throw Error(`Invalid render format.`);return Ot.encode(`diagram.zip:render:${e}:v1`)}function Pt(e){let t=``,n=32768;for(let r=0;r<e.length;r+=n)t+=String.fromCharCode(...e.subarray(r,r+n));return btoa(t).replaceAll(`+`,`-`).replaceAll(`/`,`_`).replace(/=+$/,``)}function Ft(e){if(typeof e!=`string`||!/^[A-Za-z0-9_-]+$/.test(e))throw Error(`Invalid encrypted diagram.`);let t=e.replaceAll(`-`,`+`).replaceAll(`_`,`/`),n=t+`=`.repeat((4-t.length%4)%4),r=atob(n),i=Uint8Array.from(r,e=>e.charCodeAt(0));if(Pt(i)!==e)throw Error(`Invalid encrypted diagram.`);return i}function It(e){return crypto.getRandomValues(new Uint8Array(e))}async function Lt(e,t){if(!(e instanceof Uint8Array)||e.byteLength!==32)throw Error(`Invalid diagram key.`);return crypto.subtle.importKey(`raw`,e,{name:`AES-GCM`},!1,t)}async function Rt(e,{iterations:t,salt:n}){if(typeof e!=`string`)throw Error(`Password is required.`);let r=await crypto.subtle.importKey(`raw`,Ot.encode(e),`PBKDF2`,!1,[`deriveKey`]);return crypto.subtle.deriveKey({name:`PBKDF2`,hash:`SHA-256`,iterations:t,salt:n},r,{name:`AES-GCM`,length:256},!1,[`encrypt`,`decrypt`])}async function zt(e,t,n){let r=It(12),i=await crypto.subtle.encrypt({name:`AES-GCM`,iv:r,additionalData:n,tagLength:128},t,e);return{v:1,alg:`A256GCM`,iv:Pt(r),ciphertext:Pt(new Uint8Array(i))}}async function Bt(e,t,n){if(!e||e.v!==1||e.alg!==`A256GCM`)throw Error(`Invalid encrypted diagram.`);let r=Ft(e.iv);if(r.byteLength!==12)throw Error(`Invalid encrypted diagram.`);let i=Ft(e.ciphertext);if(i.byteLength<16)throw Error(`Invalid encrypted diagram.`);return new Uint8Array(await crypto.subtle.decrypt({name:`AES-GCM`,iv:r,additionalData:n,tagLength:128},t,i))}async function Vt(e,t,n){return zt(Ot.encode(JSON.stringify(e)),t,n)}async function Ht(e,t,n){return JSON.parse(kt.decode(await Bt(e,t,n)))}function Ut(e,t){if(!e||typeof e!=`object`||!r(e.type)||typeof e.source!=`string`||!e.options||typeof e.options!=`object`||Array.isArray(e.options))throw Error(`Invalid encrypted diagram.`);return{type:e.type,source:e.source,options:e.options,presentation:H(e.presentation),meta:V(t)}}async function Wt(e,t){if(typeof t!=`string`||t.length<8)throw Error(`Password must be at least 8 characters.`);let n=It(16),r={name:`PBKDF2`,hash:`SHA-256`,iterations:Dt,salt:Pt(n)};return{v:1,kdf:r,wrap:await zt(e,await Rt(t,{iterations:r.iterations,salt:n}),Mt)}}async function Gt(e,t){if(!e||e.v!==1||e.kdf?.name!==`PBKDF2`||e.kdf.hash!==`SHA-256`||!Number.isInteger(e.kdf.iterations)||e.kdf.iterations<1e5||e.kdf.iterations>5e6)throw Error(`Invalid encrypted diagram.`);let n=Ft(e.kdf.salt);if(n.byteLength!==16)throw Error(`Invalid encrypted diagram.`);let r=await Rt(t,{iterations:e.kdf.iterations,salt:n}),i=await Bt(e.wrap,r,Mt);if(i.byteLength!==32)throw Error(`Invalid encrypted diagram.`);return i}async function Kt(e,t,n){let r=Ut({type:e.type,source:e.source,options:e.options??{},presentation:e.presentation},e.meta),i=await Lt(t,[`encrypt`]);return{mode:`locked`,encryptedContent:await Vt({type:r.type,source:r.source,options:r.options,presentation:r.presentation},i,At),encryptedMetadata:await Vt(r.meta,i,jt),keyEnvelope:n}}async function qt(e,t){let n=It(32);return{bundleKey:n,payload:await Kt(e,n,await Wt(n,t))}}async function Jt(e,t){if(!e||e.mode!==`locked`)throw Error(`Invalid encrypted diagram.`);try{let n=await Gt(e.keyEnvelope,t),r=await Lt(n,[`decrypt`]),[i,a]=await Promise.all([Ht(e.encryptedContent,r,At),Ht(e.encryptedMetadata,r,jt)]);return{bundleKey:n,state:Ut(i,a)}}catch{throw Error(`Wrong password or damaged diagram.`)}}async function Yt(e,t,n){if(!(e instanceof Blob))throw Error(`Invalid rendered image.`);let r=await Lt(t,[`encrypt`]);return zt(new Uint8Array(await e.arrayBuffer()),r,Nt(n))}var Xt=`diagram.zip:renderer:v1`,Zt=2e4,Qt=Object.freeze({mermaid:Object.freeze({frameUrl:`https://mermaid.render.diagram.zip/index.html?v=1`}),bpmn:Object.freeze({frameUrl:`https://bpmn.render.diagram.zip/index.html?v=1`}),excalidraw:Object.freeze({frameUrl:`https://excalidraw.render.diagram.zip/index.html?v=3`}),diagramsnet:Object.freeze({frameUrl:`https://diagramsnet.render.diagram.zip/index.html?v=1`})});Object.freeze(Object.keys(Qt));function $t(e){return e?.name===`AbortError`?e:new DOMException(`Render superseded.`,`AbortError`)}var en=class{constructor({documentObject:e=document,windowObject:t=window,frameUrl:n}={}){this.document=e,this.window=t,this.frameUrl=n,this.frame=null,this.ready=null,this.resolveReady=null,this.rejectReady=null,this.sequence=0,this.pending=new Map,this.handleMessage=e=>this.receive(e),this.window.addEventListener(`message`,this.handleMessage)}ensureFrame(){if(this.frame)return this.ready;let e=this.document.createElement(`iframe`);return e.title=`Diagram renderer`,e.setAttribute(`sandbox`,`allow-scripts`),e.setAttribute(`aria-hidden`,`true`),e.tabIndex=-1,Object.assign(e.style,{position:`fixed`,left:`-200vw`,top:`0`,width:`1280px`,height:`800px`,border:`0`,pointerEvents:`none`,visibility:`hidden`}),this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),e.addEventListener(`error`,()=>this.rejectReady?.(Error(`The client renderer could not be loaded.`)),{once:!0}),e.src=this.frameUrl,this.frame=e,this.document.body.append(e),this.ready}receive(e){if(!this.frame||e.source!==this.frame.contentWindow||e.data?.channel!==Xt)return;if(e.data.type===`ready`){this.resolveReady?.(),this.resolveReady=null,this.rejectReady=null;return}if(e.data.type!==`result`)return;let t=this.pending.get(e.data.requestId);t&&(this.pending.delete(e.data.requestId),t.finish(),e.data.ok&&typeof e.data.svg==`string`?t.resolve({body:e.data.svg,version:e.data.version,build:e.data.build,pipeline:e.data.pipeline,runtime:`client`}):t.reject(Error(e.data.error||`Client rendering failed.`)))}async render(e,t,n){let r;try{await Promise.race([this.ensureFrame(),new Promise((e,t)=>{r=setTimeout(()=>t(Error(`The client renderer timed out while loading.`)),Zt)})])}finally{clearTimeout(r)}if(n.aborted)throw $t(n.reason);let i=`${Date.now().toString(36)}-${++this.sequence}`;return new Promise((r,a)=>{let o=setTimeout(()=>{this.pending.delete(i),n.removeEventListener(`abort`,s),a(Error(`The client renderer timed out.`))},Zt),s=()=>{this.pending.delete(i),clearTimeout(o),a($t(n.reason))};n.addEventListener(`abort`,s,{once:!0}),this.pending.set(i,{resolve:r,reject:a,finish:()=>{clearTimeout(o),n.removeEventListener(`abort`,s)}}),this.frame.contentWindow.postMessage({channel:Xt,type:`render`,requestId:i,engine:e,source:t},`*`)})}},tn=new Map;function nn(e){let t=Qt[e];if(!t)return null;let n=tn.get(t.frameUrl);return n||(n=new en({frameUrl:t.frameUrl}),tn.set(t.frameUrl,n)),{id:e,runtime:`client`,render:({source:t},r)=>n.render(e,t,r)}}var rn=e((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.CHAR=`	
\r -퟿-�𐀀-􏿿`,e.S=` 	\r
`,e.NAME_START_CHAR=`:A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿`,e.NAME_CHAR=`-`+e.NAME_START_CHAR+`.0-9·̀-ͯ‿-⁀`,e.CHAR_RE=RegExp(`^[`+e.CHAR+`]$`,`u`),e.S_RE=RegExp(`^[`+e.S+`]+$`,`u`),e.NAME_START_CHAR_RE=RegExp(`^[`+e.NAME_START_CHAR+`]$`,`u`),e.NAME_CHAR_RE=RegExp(`^[`+e.NAME_CHAR+`]$`,`u`),e.NAME_RE=RegExp(`^[`+e.NAME_START_CHAR+`][`+e.NAME_CHAR+`]*$`,`u`),e.NMTOKEN_RE=RegExp(`^[`+e.NAME_CHAR+`]+$`,`u`);var t=9,n=10,r=13,i=32;e.S_LIST=[i,n,r,t];function a(e){return e>=i&&e<=55295||e===n||e===r||e===t||e>=57344&&e<=65533||e>=65536&&e<=1114111}e.isChar=a;function o(e){return e===i||e===n||e===r||e===t}e.isS=o;function s(e){return e>=65&&e<=90||e>=97&&e<=122||e===58||e===95||e===8204||e===8205||e>=192&&e<=214||e>=216&&e<=246||e>=248&&e<=767||e>=880&&e<=893||e>=895&&e<=8191||e>=8304&&e<=8591||e>=11264&&e<=12271||e>=12289&&e<=55295||e>=63744&&e<=64975||e>=65008&&e<=65533||e>=65536&&e<=983039}e.isNameStartChar=s;function c(e){return s(e)||e>=48&&e<=57||e===45||e===46||e===183||e>=768&&e<=879||e>=8255&&e<=8256}e.isNameChar=c})),an=e((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.CHAR=`-퟿-�𐀀-􏿿`,e.RESTRICTED_CHAR=`-\b\v\f---`,e.S=` 	\r
`,e.NAME_START_CHAR=`:A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿`,e.NAME_CHAR=`-`+e.NAME_START_CHAR+`.0-9·̀-ͯ‿-⁀`,e.CHAR_RE=RegExp(`^[`+e.CHAR+`]$`,`u`),e.RESTRICTED_CHAR_RE=RegExp(`^[`+e.RESTRICTED_CHAR+`]$`,`u`),e.S_RE=RegExp(`^[`+e.S+`]+$`,`u`),e.NAME_START_CHAR_RE=RegExp(`^[`+e.NAME_START_CHAR+`]$`,`u`),e.NAME_CHAR_RE=RegExp(`^[`+e.NAME_CHAR+`]$`,`u`),e.NAME_RE=RegExp(`^[`+e.NAME_START_CHAR+`][`+e.NAME_CHAR+`]*$`,`u`),e.NMTOKEN_RE=RegExp(`^[`+e.NAME_CHAR+`]+$`,`u`);var t=9,n=10,r=13,i=32;e.S_LIST=[i,n,r,t];function a(e){return e>=1&&e<=55295||e>=57344&&e<=65533||e>=65536&&e<=1114111}e.isChar=a;function o(e){return e>=1&&e<=8||e===11||e===12||e>=14&&e<=31||e>=127&&e<=132||e>=134&&e<=159}e.isRestrictedChar=o;function s(e){return e===9||e===10||e===13||e>31&&e<127||e===133||e>159&&e<=55295||e>=57344&&e<=65533||e>=65536&&e<=1114111}e.isCharAndNotRestricted=s;function c(e){return e===i||e===n||e===r||e===t}e.isS=c;function l(e){return e>=65&&e<=90||e>=97&&e<=122||e===58||e===95||e===8204||e===8205||e>=192&&e<=214||e>=216&&e<=246||e>=248&&e<=767||e>=880&&e<=893||e>=895&&e<=8191||e>=8304&&e<=8591||e>=11264&&e<=12271||e>=12289&&e<=55295||e>=63744&&e<=64975||e>=65008&&e<=65533||e>=65536&&e<=983039}e.isNameStartChar=l;function u(e){return l(e)||e>=48&&e<=57||e===45||e===46||e===183||e>=768&&e<=879||e>=8255&&e<=8256}e.isNameChar=u})),on=e((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.NC_NAME_START_CHAR=`A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿`,e.NC_NAME_CHAR=`-`+e.NC_NAME_START_CHAR+`.0-9·̀-ͯ‿-⁀`,e.NC_NAME_START_CHAR_RE=RegExp(`^[`+e.NC_NAME_START_CHAR+`]$`,`u`),e.NC_NAME_CHAR_RE=RegExp(`^[`+e.NC_NAME_CHAR+`]$`,`u`),e.NC_NAME_RE=RegExp(`^[`+e.NC_NAME_START_CHAR+`][`+e.NC_NAME_CHAR+`]*$`,`u`);function t(e){return e>=65&&e<=90||e===95||e>=97&&e<=122||e>=192&&e<=214||e>=216&&e<=246||e>=248&&e<=767||e>=880&&e<=893||e>=895&&e<=8191||e>=8204&&e<=8205||e>=8304&&e<=8591||e>=11264&&e<=12271||e>=12289&&e<=55295||e>=63744&&e<=64975||e>=65008&&e<=65533||e>=65536&&e<=983039}e.isNCNameStartChar=t;function n(e){return t(e)||e===45||e===46||e>=48&&e<=57||e===183||e>=768&&e<=879||e>=8255&&e<=8256}e.isNCNameChar=n})),sn=e((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.SaxesParser=e.EVENTS=void 0;var t=rn(),n=an(),r=on(),i=t.isS,a=t.isChar,o=t.isNameStartChar,s=t.isNameChar,c=t.S_LIST,l=t.NAME_RE,u=n.isChar,d=r.isNCNameStartChar,f=r.isNCNameChar,p=r.NC_NAME_RE,m=`http://www.w3.org/XML/1998/namespace`,h=`http://www.w3.org/2000/xmlns/`,ee={__proto__:null,xml:m,xmlns:h},te={__proto__:null,amp:`&`,gt:`>`,lt:`<`,quot:`"`,apos:`'`},g=-1,_=-2,ne=0,re=1,ie=2,ae=3,v=4,oe=5,se=6,ce=7,le=8,ue=9,de=10,fe=11,pe=12,y=13,me=14,he=15,ge=16,_e=17,ve=18,ye=19,be=20,xe=21,Se=22,Ce=23,we=24,Te=25,Ee=26,De=27,Oe=28,ke=29,Ae=30,je=31,Me=32,b=33,Ne=34,Pe=35,x=36,S=37,C=38,w=39,Fe=40,Ie=41,Le=42,Re=43,ze=44,Be=9,T=10,Ve=13,He=32,Ue=33,We=34,Ge=38,Ke=39,qe=45,E=47,Je=59,D=60,O=61,k=62,A=63,j=91,M=93,N=133,P=8232,F=e=>e===We||e===Ke,Ye=[We,Ke],Xe=[...Ye,j,k],Ze=[...Ye,D,M],Qe=[O,A,...c],I=[...c,k,Ge,D];function $e(e,t,n){switch(t){case`xml`:n!==m&&e.fail(`xml prefix must be bound to ${m}.`);break;case`xmlns`:n!==h&&e.fail(`xmlns prefix must be bound to ${h}.`)}switch(n){case h:e.fail(t===``?`the default namespace may not be set to ${n}.`:`may not assign a prefix (even "xmlns") to the URI \
<<<<<<<< HEAD:server/src/main/resources/web/diagramzip/assets/index-CzBQjn0p.js
<<<<<<<< HEAD:server/src/main/resources/web/diagramzip/assets/index-CzBQjn0p.js
${h}.`);break;case m:switch(t){case`xml`:break;case``:e.fail(`the default namespace may not be set to ${n}.`);break;default:e.fail(`may not assign the xml namespace to another prefix.`)}}}function L(e,t){for(let n of Object.keys(t))$e(e,n,t[n])}var et=e=>p.test(e),tt=e=>l.test(e),R=0,nt=1,rt=2;e.EVENTS=[`xmldecl`,`text`,`processinginstruction`,`doctype`,`comment`,`opentagstart`,`attribute`,`opentag`,`closetag`,`cdata`,`error`,`end`,`ready`];var z={xmldecl:`xmldeclHandler`,text:`textHandler`,processinginstruction:`piHandler`,doctype:`doctypeHandler`,comment:`commentHandler`,opentagstart:`openTagStartHandler`,attribute:`attributeHandler`,opentag:`openTagHandler`,closetag:`closeTagHandler`,cdata:`cdataHandler`,error:`errorHandler`,end:`endHandler`,ready:`readyHandler`};e.SaxesParser=class{constructor(e){this.opt=e??{},this.fragmentOpt=!!this.opt.fragment;let t=this.xmlnsOpt=!!this.opt.xmlns;if(this.trackPosition=this.opt.position!==!1,this.fileName=this.opt.fileName,t){this.nameStartCheck=d,this.nameCheck=f,this.isName=et,this.processAttribs=this.processAttribsNS,this.pushAttrib=this.pushAttribNS,this.ns=Object.assign({__proto__:null},ee);let e=this.opt.additionalNamespaces;e!=null&&(L(this,e),Object.assign(this.ns,e))}else this.nameStartCheck=o,this.nameCheck=s,this.isName=tt,this.processAttribs=this.processAttribsPlain,this.pushAttrib=this.pushAttribPlain;this.stateTable=[this.sBegin,this.sBeginWhitespace,this.sDoctype,this.sDoctypeQuote,this.sDTD,this.sDTDQuoted,this.sDTDOpenWaka,this.sDTDOpenWakaBang,this.sDTDComment,this.sDTDCommentEnding,this.sDTDCommentEnded,this.sDTDPI,this.sDTDPIEnding,this.sText,this.sEntity,this.sOpenWaka,this.sOpenWakaBang,this.sComment,this.sCommentEnding,this.sCommentEnded,this.sCData,this.sCDataEnding,this.sCDataEnding2,this.sPIFirstChar,this.sPIRest,this.sPIBody,this.sPIEnding,this.sXMLDeclNameStart,this.sXMLDeclName,this.sXMLDeclEq,this.sXMLDeclValueStart,this.sXMLDeclValue,this.sXMLDeclSeparator,this.sXMLDeclEnding,this.sOpenTag,this.sOpenTagSlash,this.sAttrib,this.sAttribName,this.sAttribNameSawWhite,this.sAttribValue,this.sAttribValueQuoted,this.sAttribValueClosed,this.sAttribValueUnquoted,this.sCloseTag,this.sCloseTagSawWhite],this._init()}get closed(){return this._closed}_init(){var e;this.openWakaBang=``,this.text=``,this.name=``,this.piTarget=``,this.entity=``,this.q=null,this.tags=[],this.tag=null,this.topNS=null,this.chunk=``,this.chunkPosition=0,this.i=0,this.prevI=0,this.carriedFromPrevious=void 0,this.forbiddenState=R,this.attribList=[];let{fragmentOpt:t}=this;this.state=t?y:ne,this.reportedTextBeforeRoot=this.reportedTextAfterRoot=this.closedRoot=this.sawRoot=t,this.xmlDeclPossible=!t,this.xmlDeclExpects=[`version`],this.entityReturnState=void 0;let{defaultXMLVersion:n}=this.opt;if(n===void 0){if(this.opt.forceXMLVersion===!0)throw Error(`forceXMLVersion set but defaultXMLVersion is not set`);n=`1.0`}this.setXMLVersion(n),this.positionAtNewLine=0,this.doctype=!1,this._closed=!1,this.xmlDecl={version:void 0,encoding:void 0,standalone:void 0},this.line=1,this.column=0,this.ENTITIES=Object.create(te),(e=this.readyHandler)==null||e.call(this)}get position(){return this.chunkPosition+this.i}get columnIndex(){return this.position-this.positionAtNewLine}on(e,t){this[z[e]]=t}off(e){this[z[e]]=void 0}makeError(e){let t=this.fileName??``;return this.trackPosition&&(t.length>0&&(t+=`:`),t+=`${this.line}:${this.column}`),t.length>0&&(t+=`: `),Error(t+e)}fail(e){let t=this.makeError(e),n=this.errorHandler;if(n===void 0)throw t;return n(t),this}write(e){if(this.closed)return this.fail(`cannot write after close; assign an onready handler.`);let t=!1;e===null?(t=!0,e=``):typeof e==`object`&&(e=e.toString()),this.carriedFromPrevious!==void 0&&(e=`${this.carriedFromPrevious}${e}`,this.carriedFromPrevious=void 0);let n=e.length,r=e.charCodeAt(n-1);!t&&(r===Ve||r>=55296&&r<=56319)&&(this.carriedFromPrevious=e[n-1],n--,e=e.slice(0,n));let{stateTable:i}=this;for(this.chunk=e,this.i=0;this.i<n;)i[this.state].call(this);return this.chunkPosition+=n,t?this.end():this}close(){return this.write(null)}getCode10(){let{chunk:e,i:t}=this;if(this.prevI=t,this.i=t+1,t>=e.length)return g;let n=e.charCodeAt(t);if(this.column++,n<55296){if(n>=He||n===Be)return n;switch(n){case T:return this.line++,this.column=0,this.positionAtNewLine=this.position,T;case Ve:return e.charCodeAt(t+1)===T&&(this.i=t+2),this.line++,this.column=0,this.positionAtNewLine=this.position,_;default:return this.fail(`disallowed character.`),n}}if(n>56319)return n>=57344&&n<=65533||this.fail(`disallowed character.`),n;let r=65536+(n-55296)*1024+(e.charCodeAt(t+1)-56320);return this.i=t+2,r>1114111&&this.fail(`disallowed character.`),r}getCode11(){let{chunk:e,i:t}=this;if(this.prevI=t,this.i=t+1,t>=e.length)return g;let n=e.charCodeAt(t);if(this.column++,n<55296){if(n>31&&n<127||n>159&&n!==P||n===Be)return n;switch(n){case T:return this.line++,this.column=0,this.positionAtNewLine=this.position,T;case Ve:{let n=e.charCodeAt(t+1);(n===T||n===N)&&(this.i=t+2)}case N:case P:return this.line++,this.column=0,this.positionAtNewLine=this.position,_;default:return this.fail(`disallowed character.`),n}}if(n>56319)return n>=57344&&n<=65533||this.fail(`disallowed character.`),n;let r=65536+(n-55296)*1024+(e.charCodeAt(t+1)-56320);return this.i=t+2,r>1114111&&this.fail(`disallowed character.`),r}getCodeNorm(){let e=this.getCode();return e===_?T:e}unget(){this.i=this.prevI,this.column--}captureTo(e){let{i:t}=this,{chunk:n}=this;for(;;){let r=this.getCode(),i=r===_,a=i?T:r;if(a===g||e.includes(a))return this.text+=n.slice(t,this.prevI),a;i&&(this.text+=`${n.slice(t,this.prevI)}\n`,t=this.i)}}captureToChar(e){let{i:t}=this,{chunk:n}=this;for(;;){let r=this.getCode();switch(r){case _:this.text+=`${n.slice(t,this.prevI)}\n`,t=this.i,r=T;break;case g:return this.text+=n.slice(t),!1}if(r===e)return this.text+=n.slice(t,this.prevI),!0}}captureNameChars(){let{chunk:e,i:t}=this;for(;;){let n=this.getCode();if(n===g)return this.name+=e.slice(t),g;if(!s(n))return this.name+=e.slice(t,this.prevI),n===_?T:n}}skipSpaces(){for(;;){let e=this.getCodeNorm();if(e===g||!i(e))return e}}setXMLVersion(e){this.currentXMLVersion=e,e===`1.0`?(this.isChar=a,this.getCode=this.getCode10):(this.isChar=u,this.getCode=this.getCode11)}sBegin(){this.chunk.charCodeAt(0)===65279&&(this.i++,this.column++),this.state=re}sBeginWhitespace(){let e=this.i,t=this.skipSpaces();switch(this.prevI!==e&&(this.xmlDeclPossible=!1),t){case D:if(this.state=he,this.text.length!==0)throw Error(`no-empty text at start`);break;case g:break;default:this.unget(),this.state=y,this.xmlDeclPossible=!1}}sDoctype(){var e;let t=this.captureTo(Xe);switch(t){case k:(e=this.doctypeHandler)==null||e.call(this,this.text),this.text=``,this.state=y,this.doctype=!0;break;case g:break;default:this.text+=String.fromCodePoint(t),t===j?this.state=v:F(t)&&(this.state=ae,this.q=t)}}sDoctypeQuote(){let e=this.q;this.captureToChar(e)&&(this.text+=String.fromCodePoint(e),this.q=null,this.state=ie)}sDTD(){let e=this.captureTo(Ze);e!==g&&(this.text+=String.fromCodePoint(e),e===M?this.state=ie:e===D?this.state=se:F(e)&&(this.state=oe,this.q=e))}sDTDQuoted(){let e=this.q;this.captureToChar(e)&&(this.text+=String.fromCodePoint(e),this.state=v,this.q=null)}sDTDOpenWaka(){let e=this.getCodeNorm();switch(this.text+=String.fromCodePoint(e),e){case Ue:this.state=ce,this.openWakaBang=``;break;case A:this.state=fe;break;default:this.state=v}}sDTDOpenWakaBang(){let e=String.fromCodePoint(this.getCodeNorm()),t=this.openWakaBang+=e;this.text+=e,t!==`-`&&(this.state=t===`--`?le:v,this.openWakaBang=``)}sDTDComment(){this.captureToChar(qe)&&(this.text+=`-`,this.state=ue)}sDTDCommentEnding(){let e=this.getCodeNorm();this.text+=String.fromCodePoint(e),this.state=e===qe?de:le}sDTDCommentEnded(){let e=this.getCodeNorm();this.text+=String.fromCodePoint(e),e===k?this.state=v:(this.fail(`malformed comment.`),this.state=le)}sDTDPI(){this.captureToChar(A)&&(this.text+=`?`,this.state=pe)}sDTDPIEnding(){let e=this.getCodeNorm();this.text+=String.fromCodePoint(e),e===k&&(this.state=v)}sText(){this.tags.length===0?this.handleTextOutsideRoot():this.handleTextInRoot()}sEntity(){let{i:e}=this,{chunk:t}=this;loop:for(;;)switch(this.getCode()){case _:this.entity+=`${t.slice(e,this.prevI)}\n`,e=this.i;break;case Je:{let{entityReturnState:n}=this,r=this.entity+t.slice(e,this.prevI);this.state=n;let i;r===``?(this.fail(`empty entity name.`),i=`&;`):(i=this.parseEntity(r),this.entity=``),(n!==y||this.textHandler!==void 0)&&(this.text+=i);break loop}case g:this.entity+=t.slice(e);break loop}}sOpenWaka(){let e=this.getCode();if(o(e))this.state=Ne,this.unget(),this.xmlDeclPossible=!1;else switch(e){case E:this.state=Re,this.xmlDeclPossible=!1;break;case Ue:this.state=ge,this.openWakaBang=``,this.xmlDeclPossible=!1;break;case A:this.state=Ce;break;default:this.fail(`disallowed character in tag name`),this.state=y,this.xmlDeclPossible=!1}}sOpenWakaBang(){switch(this.openWakaBang+=String.fromCodePoint(this.getCodeNorm()),this.openWakaBang){case`[CDATA[`:!this.sawRoot&&!this.reportedTextBeforeRoot&&(this.fail(`text data outside of root node.`),this.reportedTextBeforeRoot=!0),this.closedRoot&&!this.reportedTextAfterRoot&&(this.fail(`text data outside of root node.`),this.reportedTextAfterRoot=!0),this.state=be,this.openWakaBang=``;break;case`--`:this.state=_e,this.openWakaBang=``;break;case`DOCTYPE`:this.state=ie,(this.doctype||this.sawRoot)&&this.fail(`inappropriately located doctype declaration.`),this.openWakaBang=``;break;default:this.openWakaBang.length>=7&&this.fail(`incorrect syntax.`)}}sComment(){this.captureToChar(qe)&&(this.state=ve)}sCommentEnding(){var e;let t=this.getCodeNorm();t===qe?(this.state=ye,(e=this.commentHandler)==null||e.call(this,this.text),this.text=``):(this.text+=`-${String.fromCodePoint(t)}`,this.state=_e)}sCommentEnded(){let e=this.getCodeNorm();e===k?this.state=y:(this.fail(`malformed comment.`),this.text+=`--${String.fromCodePoint(e)}`,this.state=_e)}sCData(){this.captureToChar(M)&&(this.state=xe)}sCDataEnding(){let e=this.getCodeNorm();e===M?this.state=Se:(this.text+=`]${String.fromCodePoint(e)}`,this.state=be)}sCDataEnding2(){var e;let t=this.getCodeNorm();switch(t){case k:(e=this.cdataHandler)==null||e.call(this,this.text),this.text=``,this.state=y;break;case M:this.text+=`]`;break;default:this.text+=`]]${String.fromCodePoint(t)}`,this.state=be}}sPIFirstChar(){let e=this.getCodeNorm();this.nameStartCheck(e)?(this.piTarget+=String.fromCodePoint(e),this.state=we):e===A||i(e)?(this.fail(`processing instruction without a target.`),this.state=e===A?Ee:Te):(this.fail(`disallowed character in processing instruction name.`),this.piTarget+=String.fromCodePoint(e),this.state=we)}sPIRest(){let{chunk:e,i:t}=this;for(;;){let n=this.getCodeNorm();if(n===g){this.piTarget+=e.slice(t);return}if(!this.nameCheck(n)){this.piTarget+=e.slice(t,this.prevI);let r=n===A;r||i(n)?this.piTarget===`xml`?(this.xmlDeclPossible||this.fail(`an XML declaration must be at the start of the document.`),this.state=r?b:De):this.state=r?Ee:Te:(this.fail(`disallowed character in processing instruction name.`),this.piTarget+=String.fromCodePoint(n));break}}}sPIBody(){if(this.text.length===0){let e=this.getCodeNorm();e===A?this.state=Ee:i(e)||(this.text=String.fromCodePoint(e))}else this.captureToChar(A)&&(this.state=Ee)}sPIEnding(){var e;let t=this.getCodeNorm();if(t===k){let{piTarget:t}=this;t.toLowerCase()===`xml`&&this.fail(`the XML declaration must appear at the start of the document.`),(e=this.piHandler)==null||e.call(this,{target:t,body:this.text}),this.piTarget=this.text=``,this.state=y}else t===A?this.text+=`?`:(this.text+=`?${String.fromCodePoint(t)}`,this.state=Te);this.xmlDeclPossible=!1}sXMLDeclNameStart(){let e=this.skipSpaces();if(e===A){this.state=b;return}e!==g&&(this.state=Oe,this.name=String.fromCodePoint(e))}sXMLDeclName(){let e=this.captureTo(Qe);if(e===A){this.state=b,this.name+=this.text,this.text=``,this.fail(`XML declaration is incomplete.`);return}if(i(e)||e===O){if(this.name+=this.text,this.text=``,!this.xmlDeclExpects.includes(this.name))switch(this.name.length){case 0:this.fail(`did not expect any more name/value pairs.`);break;case 1:this.fail(`expected the name ${this.xmlDeclExpects[0]}.`);break;default:this.fail(`expected one of ${this.xmlDeclExpects.join(`, `)}`)}this.state=e===O?Ae:ke}}sXMLDeclEq(){let e=this.getCodeNorm();if(e===A){this.state=b,this.fail(`XML declaration is incomplete.`);return}i(e)||(e!==O&&this.fail(`value required.`),this.state=Ae)}sXMLDeclValueStart(){let e=this.getCodeNorm();if(e===A){this.state=b,this.fail(`XML declaration is incomplete.`);return}i(e)||(F(e)?this.q=e:(this.fail(`value must be quoted.`),this.q=He),this.state=je)}sXMLDeclValue(){let e=this.captureTo([this.q,A]);if(e===A){this.state=b,this.text=``,this.fail(`XML declaration is incomplete.`);return}if(e===g)return;let t=this.text;switch(this.text=``,this.name){case`version`:{this.xmlDeclExpects=[`encoding`,`standalone`];let e=t;this.xmlDecl.version=e,/^1\.[0-9]+$/.test(e)?this.opt.forceXMLVersion||this.setXMLVersion(e):this.fail(`version number must match /^1\\.[0-9]+$/.`);break}case`encoding`:/^[A-Za-z][A-Za-z0-9._-]*$/.test(t)||this.fail(`encoding value must match /^[A-Za-z0-9][A-Za-z0-9._-]*$/.`),this.xmlDeclExpects=[`standalone`],this.xmlDecl.encoding=t;break;case`standalone`:t!==`yes`&&t!==`no`&&this.fail(`standalone value must match "yes" or "no".`),this.xmlDeclExpects=[],this.xmlDecl.standalone=t}this.name=``,this.state=Me}sXMLDeclSeparator(){let e=this.getCodeNorm();if(e===A){this.state=b;return}i(e)||(this.fail(`whitespace required.`),this.unget()),this.state=De}sXMLDeclEnding(){var e;this.getCodeNorm()===k?(this.piTarget===`xml`?this.name!==`version`&&this.xmlDeclExpects.includes(`version`)&&this.fail(`XML declaration must contain a version.`):this.fail(`processing instructions are not allowed before root.`),(e=this.xmldeclHandler)==null||e.call(this,this.xmlDecl),this.name=``,this.piTarget=this.text=``,this.state=y):this.fail(`The character ? is disallowed anywhere in XML declarations.`),this.xmlDeclPossible=!1}sOpenTag(){var e;let t=this.captureNameChars();if(t===g)return;let n=this.tag={name:this.name,attributes:Object.create(null)};switch(this.name=``,this.xmlnsOpt&&(this.topNS=n.ns=Object.create(null)),(e=this.openTagStartHandler)==null||e.call(this,n),this.sawRoot=!0,!this.fragmentOpt&&this.closedRoot&&this.fail(`documents may contain only one root.`),t){case k:this.openTag();break;case E:this.state=Pe;break;default:i(t)||this.fail(`disallowed character in tag name.`),this.state=x}}sOpenTagSlash(){this.getCode()===k?this.openSelfClosingTag():(this.fail(`forward-slash in opening tag not followed by >.`),this.state=x)}sAttrib(){let e=this.skipSpaces();e!==g&&(o(e)?(this.unget(),this.state=S):e===k?this.openTag():e===E?this.state=Pe:this.fail(`disallowed character in attribute name.`))}sAttribName(){let e=this.captureNameChars();e===O?this.state=w:i(e)?this.state=C:e===k?(this.fail(`attribute without value.`),this.pushAttrib(this.name,this.name),this.name=this.text=``,this.openTag()):e!==g&&this.fail(`disallowed character in attribute name.`)}sAttribNameSawWhite(){let e=this.skipSpaces();switch(e){case g:return;case O:this.state=w;break;default:this.fail(`attribute without value.`),this.text=``,this.name=``,e===k?this.openTag():o(e)?(this.unget(),this.state=S):(this.fail(`disallowed character in attribute name.`),this.state=x)}}sAttribValue(){let e=this.getCodeNorm();F(e)?(this.q=e,this.state=Fe):i(e)||(this.fail(`unquoted attribute value.`),this.state=Le,this.unget())}sAttribValueQuoted(){let{q:e,chunk:t}=this,{i:n}=this;for(;;)switch(this.getCode()){case e:this.pushAttrib(this.name,this.text+t.slice(n,this.prevI)),this.name=this.text=``,this.q=null,this.state=Ie;return;case Ge:this.text+=t.slice(n,this.prevI),this.state=me,this.entityReturnState=Fe;return;case T:case _:case Be:this.text+=`${t.slice(n,this.prevI)} `,n=this.i;break;case D:this.text+=t.slice(n,this.prevI),this.fail(`disallowed character.`);return;case g:this.text+=t.slice(n);return}}sAttribValueClosed(){let e=this.getCodeNorm();i(e)?this.state=x:e===k?this.openTag():e===E?this.state=Pe:o(e)?(this.fail(`no whitespace between attributes.`),this.unget(),this.state=S):this.fail(`disallowed character in attribute name.`)}sAttribValueUnquoted(){let e=this.captureTo(I);switch(e){case Ge:this.state=me,this.entityReturnState=Le;break;case D:this.fail(`disallowed character.`);break;case g:break;default:this.text.includes(`]]>`)&&this.fail(`the string "]]>" is disallowed in char data.`),this.pushAttrib(this.name,this.text),this.name=this.text=``,e===k?this.openTag():this.state=x}}sCloseTag(){let e=this.captureNameChars();e===k?this.closeTag():i(e)?this.state=ze:e!==g&&this.fail(`disallowed character in closing tag.`)}sCloseTagSawWhite(){switch(this.skipSpaces()){case k:this.closeTag();break;case g:break;default:this.fail(`disallowed character in closing tag.`)}}handleTextInRoot(){let{i:e,forbiddenState:t}=this,{chunk:n,textHandler:r}=this;scanLoop:for(;;)switch(this.getCode()){case D:if(this.state=he,r!==void 0){let{text:t}=this,i=n.slice(e,this.prevI);t.length===0?i.length!==0&&r(i):(r(t+i),this.text=``)}t=R;break scanLoop;case Ge:this.state=me,this.entityReturnState=y,r!==void 0&&(this.text+=n.slice(e,this.prevI)),t=R;break scanLoop;case M:switch(t){case R:t=nt;break;case nt:t=rt;break;case rt:break;default:throw Error(`impossible state`)}break;case k:t===rt&&this.fail(`the string "]]>" is disallowed in char data.`),t=R;break;case _:r!==void 0&&(this.text+=`${n.slice(e,this.prevI)}\n`),e=this.i,t=R;break;case g:r!==void 0&&(this.text+=n.slice(e));break scanLoop;default:t=R}this.forbiddenState=t}handleTextOutsideRoot(){let{i:e}=this,{chunk:t,textHandler:n}=this,r=!1;outRootLoop:for(;;){let a=this.getCode();switch(a){case D:if(this.state=he,n!==void 0){let{text:r}=this,i=t.slice(e,this.prevI);r.length===0?i.length!==0&&n(i):(n(r+i),this.text=``)}break outRootLoop;case Ge:this.state=me,this.entityReturnState=y,n!==void 0&&(this.text+=t.slice(e,this.prevI)),r=!0;break outRootLoop;case _:n!==void 0&&(this.text+=`${t.slice(e,this.prevI)}\n`),e=this.i;break;case g:n!==void 0&&(this.text+=t.slice(e));break outRootLoop;default:i(a)||(r=!0)}}r&&(!this.sawRoot&&!this.reportedTextBeforeRoot&&(this.fail(`text data outside of root node.`),this.reportedTextBeforeRoot=!0),this.closedRoot&&!this.reportedTextAfterRoot&&(this.fail(`text data outside of root node.`),this.reportedTextAfterRoot=!0))}pushAttribNS(e,t){var n;let{prefix:r,local:i}=this.qname(e),a={name:e,prefix:r,local:i,value:t};if(this.attribList.push(a),(n=this.attributeHandler)==null||n.call(this,a),r===`xmlns`){let e=t.trim();this.currentXMLVersion===`1.0`&&e===``&&this.fail(`invalid attempt to undefine prefix in XML 1.0`),this.topNS[i]=e,$e(this,i,e)}else if(e===`xmlns`){let e=t.trim();this.topNS[``]=e,$e(this,``,e)}}pushAttribPlain(e,t){var n;let r={name:e,value:t};this.attribList.push(r),(n=this.attributeHandler)==null||n.call(this,r)}end(){var e,t;this.sawRoot||this.fail(`document must contain a root element.`);let{tags:n}=this;for(;n.length>0;){let e=n.pop();this.fail(`unclosed tag: ${e.name}`)}this.state!==ne&&this.state!==y&&this.fail(`unexpected end.`);let{text:r}=this;return r.length!==0&&((e=this.textHandler)==null||e.call(this,r),this.text=``),this._closed=!0,(t=this.endHandler)==null||t.call(this),this._init(),this}resolve(e){var t;let n=this.topNS[e];if(n!==void 0)return n;let{tags:r}=this;for(let t=r.length-1;t>=0;t--)if(n=r[t].ns[e],n!==void 0)return n;return n=this.ns[e],n===void 0?(t=this.opt).resolvePrefix?.call(t,e):n}qname(e){let t=e.indexOf(`:`);if(t===-1)return{prefix:``,local:e};let n=e.slice(t+1),r=e.slice(0,t);return(r===``||n===``||n.includes(`:`))&&this.fail(`malformed name: ${e}.`),{prefix:r,local:n}}processAttribsNS(){let{attribList:e}=this,t=this.tag;{let{prefix:e,local:n}=this.qname(t.name);t.prefix=e,t.local=n;let r=t.uri=this.resolve(e)??``;e!==``&&(e===`xmlns`&&this.fail(`tags may not have "xmlns" as prefix.`),r===``&&(this.fail(`unbound namespace prefix: ${JSON.stringify(e)}.`),t.uri=e))}if(e.length===0)return;let{attributes:n}=t,r=new Set;for(let t of e){let{name:e,prefix:i,local:a}=t,o,s;i===``?(o=e===`xmlns`?h:``,s=e):(o=this.resolve(i),o===void 0&&(this.fail(`unbound namespace prefix: ${JSON.stringify(i)}.`),o=i),s=`{${o}}${a}`),r.has(s)&&this.fail(`duplicate attribute: ${s}.`),r.add(s),t.uri=o,n[e]=t}this.attribList=[]}processAttribsPlain(){let{attribList:e}=this,t=this.tag.attributes;for(let{name:n,value:r}of e)t[n]!==void 0&&this.fail(`duplicate attribute: ${n}.`),t[n]=r;this.attribList=[]}openTag(){var e;this.processAttribs();let{tags:t}=this,n=this.tag;n.isSelfClosing=!1,(e=this.openTagHandler)==null||e.call(this,n),t.push(n),this.state=y,this.name=``}openSelfClosingTag(){var e,t;this.processAttribs();let{tags:n}=this,r=this.tag;r.isSelfClosing=!0,(e=this.openTagHandler)==null||e.call(this,r),(t=this.closeTagHandler)==null||t.call(this,r),(this.tag=n[n.length-1]??null)===null&&(this.closedRoot=!0),this.state=y,this.name=``}closeTag(){let{tags:e,name:t}=this;if(this.state=y,this.name=``,t===``){this.fail(`weird empty close tag.`),this.text+=`</>`;return}let n=this.closeTagHandler,r=e.length;for(;r-->0;){let r=this.tag=e.pop();if(this.topNS=r.ns,n?.(r),r.name===t)break;this.fail(`unexpected close tag.`)}r===0?this.closedRoot=!0:r<0&&(this.fail(`unmatched closing tag: ${t}.`),this.text+=`</${t}>`)}parseEntity(e){if(e[0]!==`#`){let t=this.ENTITIES[e];return t===void 0?(this.fail(this.isName(e)?`undefined entity.`:`disallowed character in entity name.`),`&${e};`):t}let t=NaN;return e[1]===`x`&&/^#x[0-9a-f]+$/i.test(e)?t=parseInt(e.slice(2),16):/^#[0-9]+$/.test(e)&&(t=parseInt(e.slice(1),10)),this.isChar(t)?String.fromCodePoint(t):(this.fail(`malformed character entity.`),`&${e};`)}}}))(),cn=4194304,ln=new Set([`script`,`iframe`,`object`,`embed`,`audio`,`video`]),un=new Set([`foreignobject`,`div`,`span`,`p`,`br`,`b`,`strong`,`i`,`em`,`small`,`sub`,`sup`,`code`,`ul`,`ol`,`li`,`a`]),dn=/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i,fn=/^data:(?:font\/(?:woff2?|opentype|truetype)|application\/(?:x-)?font-woff2?);base64,[a-z0-9+/=\s]+$/i,pn=class extends Error{constructor(e){super(e),this.name=`ClientSvgError`}};function mn(e){let t=e.trim();return t.startsWith(`#`)||dn.test(t)||fn.test(t)}function hn(e){if(/@import|expression\s*\(|javascript\s*:|data\s*:\s*text\/html|behavior\s*:|-moz-binding/i.test(e))return!0;let t=/url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi;for(let n of e.matchAll(t))if(!mn(n[2]??``))return!0;return/url\s*\(/i.test(e.replace(t,``))}function gn(e){let t=e.trim();return t.startsWith(`#`)||dn.test(t)}function _n(e,t){let n=e.toLowerCase();return n.startsWith(`on`)?!1:n===`href`||n===`xlink:href`||n===`src`?gn(t):[`style`,`filter`,`fill`,`stroke`,`clip-path`,`mask`].includes(n)?!hn(t):n!==`xml:base`&&!/javascript\s*:/i.test(t)}function vn(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`)}function yn(e){return vn(e).replaceAll(`"`,`&quot;`)}function bn(e){if(e.type===`text`)return vn(e.value);let t=[...e.attributes].map(([e,t])=>` ${e}="${yn(t)}"`).join(``);return`<${e.name}${t}>${e.children.map(bn).join(``)}</${e.name}>`}function xn(e){return e.name.toLowerCase().split(`:`).at(-1)??e.name.toLowerCase()}function Sn(e){if(e===void 0||!/^-?\d+(?:\.\d+)?(?:px)?$/.test(e.trim()))return null;let t=Number.parseFloat(e);return Number.isFinite(t)&&t>0?t:null}function Cn(e){let t=e.attributes.get(`viewBox`)?.trim().split(/[\s,]+/).map(Number);if(t?.length===4&&t.every(Number.isFinite)&&t[2]>0&&t[3]>0)return t;let n=Sn(e.attributes.get(`width`)),r=Sn(e.attributes.get(`height`));return n!==null&&r!==null?[0,0,n,r]:null}function wn(e,t){let n=e.attributes.get(`style`);if(!n)return null;for(let e of n.split(`;`)){let n=e.indexOf(`:`);if(n>=0&&e.slice(0,n).trim().toLowerCase()===t)return e.slice(n+1).trim()}return null}function Tn(e){let t=(e.attributes.get(`fill`)??wn(e,`fill`)??``).replaceAll(` `,``).toLowerCase();return t===`white`||t===`#fff`||t===`#ffffff`||t===`rgb(255,255,255)`}function En(e){if(e===void 0||!/^-?\d+(?:\.\d+)?$/.test(e.trim()))return null;let t=Number(e);return Number.isFinite(t)?t:null}function Dn(e,t){let n=e.attributes.get(`width`)?.trim(),r=e.attributes.get(`height`)?.trim();if(n===`100%`&&r===`100%`)return!0;let i=En(e.attributes.get(`x`)??`0`),a=En(e.attributes.get(`y`)??`0`),o=En(n),s=En(r);if([i,a,o,s].some(e=>e===null))return!1;let[c,l,u,d]=t,f=.01;return i<=c+f&&a<=l+f&&i+o>=c+u-f&&a+s>=l+d-f}function On(e,t,n){let r=xn(e),i=new Set((e.attributes.get(`class`)??``).toLowerCase().split(/\s+/));return r===`rect`&&i.has(`backdrop`)||r===`rect`&&t!==null&&Tn(e)&&Dn(e,t)?!0:n===`graphviz`&&r===`polygon`&&Tn(e)&&(e.attributes.get(`stroke`)??``).toLowerCase()===`none`}function kn(e,t,n){let r=xn(e)===`svg`?Cn(e)??t:t;e.children=e.children.filter(e=>e.type===`text`||!On(e,r,n)&&(kn(e,r,n),!0))}function An(e,t){let n=(e.attributes.get(`style`)??``).split(`;`).map(e=>e.trim()).filter(Boolean).filter(e=>!/^background(?:-color)?\s*:/i.test(e));n.push(`background-color:${t}`),e.attributes.set(`style`,`${n.join(`;`)};`)}function jn(e,t=[],n=[]){return{type:`element`,name:e,attributes:new Map(t),children:n}}function Mn(e,t,n,r){let i=[],a=null;t.title&&i.push(jn(`title`,[],[{type:`text`,value:t.title}])),t.description&&i.push(jn(`desc`,[],[{type:`text`,value:t.description}]));let o=Cn(e);if((n.padding||n.background||n.frame)&&o===null)throw new pn(`Renderer output has no usable SVG dimensions for presentation settings.`);if(o!==null){let[t,r,s,c]=o,l=n.padding,u=[t-l,r-l,s+l*2,c+l*2];e.attributes.set(`viewBox`,u.join(` `)),e.attributes.has(`width`)&&e.attributes.set(`width`,String(u[2])),e.attributes.has(`height`)&&e.attributes.set(`height`,String(u[3])),n.background&&i.push(jn(`rect`,[[`x`,String(u[0])],[`y`,String(u[1])],[`width`,String(u[2])],[`height`,String(u[3])],[`fill`,n.background]])),n.frame&&(a=jn(`rect`,[[`x`,String(u[0]+.5)],[`y`,String(u[1]+.5)],[`width`,String(Math.max(0,u[2]-1))],[`height`,String(Math.max(0,u[3]-1))],[`fill`,`none`],[`stroke`,`#000000`],[`stroke-width`,`1`],[`vector-effect`,`non-scaling-stroke`]]))}n.background&&(kn(e,o,r),An(e,n.background)),e.children.unshift(...i),a&&e.children.push(a)}function Nn(e,t,n,r){if(e.length>cn)throw new pn(`Rendered SVG is too large.`);let i=null,a=[],o=0,s=null,c=new sn.SaxesParser({xmlns:!0});c.on(`doctype`,e=>{e.includes(`[`)&&(s=Error(`Internal DOCTYPE subsets are not allowed`))}),c.on(`opentag`,e=>{let t=e.local.toLowerCase(),n=t===`foreignobject`||a.some(e=>xn(e)===`foreignobject`);if(o>0||ln.has(t)||n&&!un.has(t)){o++;return}let r=jn(e.name);for(let t of Object.values(e.attributes))_n(t.name,t.value)&&r.attributes.set(t.name,t.value);let c=a.at(-1);c?c.children.push(r):i===null?i=r:s=Error(`Multiple root elements`),a.push(r)});let l=e=>{if(o>0||e===``)return;let t=a.at(-1);if(t){if(xn(t)===`style`&&hn(e))throw new pn(`Renderer output contains unsafe CSS.`);t.children.push({type:`text`,value:e})}else e.trim()!==``&&(s=Error(`Text outside root element`))};c.on(`text`,l),c.on(`cdata`,l),c.on(`closetag`,()=>{o>0?o--:a.pop()}),c.on(`error`,e=>{s=e});try{c.write(e).close()}catch(e){if(e instanceof pn)throw e;s=e}if(s!==null||i===null||xn(i)!==`svg`)throw new pn(`Renderer returned invalid SVG.`);return Mn(i,t,n,r),bn(i)}var Pn=Object.freeze({plantuml:`https://plantuml.render.diagram.zip/v1/svg`,graphviz:`https://graphviz.render.diagram.zip/v1/svg`,d2:`https://d2.render.diagram.zip/v1/svg`,c4plantuml:`https://c4plantuml.render.diagram.zip/v1/svg`,blockdiag:`https://blockdiag.render.diagram.zip/v1/svg`,seqdiag:`https://seqdiag.render.diagram.zip/v1/svg`,actdiag:`https://actdiag.render.diagram.zip/v1/svg`,nwdiag:`https://nwdiag.render.diagram.zip/v1/svg`,packetdiag:`https://packetdiag.render.diagram.zip/v1/svg`,rackdiag:`https://rackdiag.render.diagram.zip/v1/svg`,bytefield:`https://bytefield.render.diagram.zip/v1/svg`,dbml:`https://dbml.render.diagram.zip/v1/svg`,diagramsnet:`https://diagramsnet.render.diagram.zip/v1/svg`,ditaa:`https://ditaa.render.diagram.zip/v1/svg`,erd:`https://erd.render.diagram.zip/v1/svg`,goat:`https://goat.render.diagram.zip/v1/svg`,nomnoml:`https://nomnoml.render.diagram.zip/v1/svg`,pikchr:`https://pikchr.render.diagram.zip/v1/svg`,structurizr:`https://structurizr.render.diagram.zip/v1/svg`,svgbob:`https://svgbob.render.diagram.zip/v1/svg`,symbolator:`https://symbolator.render.diagram.zip/v1/svg`,tikz:`https://tikz.render.diagram.zip/v1/svg`,umlet:`https://umlet.render.diagram.zip/v1/svg`,vega:`https://vega.render.diagram.zip/v1/svg`,vegalite:`https://vegalite.render.diagram.zip/v1/svg`,wavedrom:`https://wavedrom.render.diagram.zip/v1/svg`,wireviz:`https://wireviz.render.diagram.zip/v1/svg`}),Fn=Object.freeze([`mermaid`,`bpmn`,`excalidraw`,`bytefield`,`nomnoml`,`vega`,`vegalite`,`wavedrom`,`blockdiag`,`seqdiag`,`actdiag`,`nwdiag`,`packetdiag`,`rackdiag`,`graphviz`,`erd`,`pikchr`,`svgbob`,`wireviz`]);function In(e){return Fn.includes(e)}function Ln(e){return Pn[e]??null}function W(e,t,n){return Math.min(Math.max(e,t),n)}var Rn=class{constructor({stage:e,image:t,status:n,minimap:r,minimapImage:i,minimapViewport:a}){this.stage=e,this.image=t,this.status=n,this.minimap=r,this.minimapImage=i,this.minimapViewport=a,this.scale=1,this.x=0,this.y=0,this.objectUrl=null,this.abortController=null,this.requestNumber=0,this.pendingRender=null,this.renderLoop=null,this.latestRenderKey=null,this.latestSvgBlob=null,this.latestRendererIdentity=null,this.imageFallbackUrl=null,this.activeImageUrl=null,this.drag=null,this.image.addEventListener(`load`,()=>{this.image.src===this.activeImageUrl&&(this.imageFallbackUrl=null,this.setStatus(`Rendered`,`ready`),this.fit())}),this.image.addEventListener(`error`,()=>this.retryBlockedImage()),this.stage.addEventListener(`pointerdown`,e=>this.startPan(e)),this.stage.addEventListener(`pointermove`,e=>this.pan(e)),this.stage.addEventListener(`pointerup`,e=>this.endPan(e)),this.stage.addEventListener(`pointercancel`,e=>this.endPan(e)),this.stage.addEventListener(`wheel`,e=>this.wheelZoom(e),{passive:!1}),this.minimap.addEventListener(`pointerdown`,e=>this.moveFromMinimap(e)),new ResizeObserver(()=>this.updateTransform()).observe(this.stage)}render({type:e,source:t,options:n={},meta:r={},presentation:i={}}){if(!t.trim()){this.requestNumber++,this.pendingRender=null,this.abortController?.abort(),this.setStatus(`Write something to render.`,`idle`);return}let a=JSON.stringify({type:e,source:t,options:n,meta:r,presentation:i});return this.latestRenderKey===a&&this.latestSvgBlob?Promise.resolve():(this.pendingRender={type:e,source:t,options:n,meta:r,presentation:i,renderKey:a,requestNumber:++this.requestNumber},this.abortController?.abort(),this.renderLoop||=this.drainRenderQueue(),this.renderLoop)}async drainRenderQueue(){try{for(;this.pendingRender;){let e=this.pendingRender;this.pendingRender=null,await this.performRender(e)}}finally{this.renderLoop=null,this.pendingRender&&(this.renderLoop=this.drainRenderQueue())}}async performRender({type:e,source:t,options:n,meta:r,presentation:i,renderKey:a,requestNumber:o}){let s=new AbortController;this.abortController=s,this.setStatus(`Rendering…`,`loading`),this.stage.style.setProperty(`--render-background`,`var(--preview-bg)`);try{let c=nn(e),l;if(c)try{let a=await c.render({type:e,source:t,options:n},s.signal);l={body:Nn(a.body,r,i,e),identity:{unit:e,build:a.build||a.version,pipeline:Array.isArray(a.pipeline)?a.pipeline:[e]}},this.status.dataset.cache=`browser`,this.status.dataset.renderer=e}catch(a){if(a.name===`AbortError`||In(e))throw a;l=await this.renderThroughGateway({type:e,source:t,options:n,meta:r,presentation:i},s.signal)}else l=await this.renderThroughGateway({type:e,source:t,options:n,meta:r,presentation:i},s.signal);if(o!==this.requestNumber)return;let{blob:u,background:d}=this.normalizedSvgBlob(l.body);this.latestRenderKey=a,this.latestSvgBlob=u,this.latestRendererIdentity=l.identity,this.imageFallbackUrl=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(await u.text())}`,this.stage.style.setProperty(`--render-background`,d);let f=URL.createObjectURL(u),p=this.objectUrl;this.objectUrl=f,this.activeImageUrl=f,this.image.src=f,this.minimapImage.src=f,this.image.hidden=!1,this.setStatus(`Loading image…`,`loading`),p&&URL.revokeObjectURL(p)}catch(e){if(e.name===`AbortError`)return;this.setStatus(e.message||`Could not render this diagram.`,`error`)}finally{this.abortController===s&&(this.abortController=null)}}async renderThroughGateway({type:e,source:t,options:n,meta:r,presentation:i},a){let o=Ln(e);if(o){try{let s=await this.renderRequest(o,{source:t,format:`svg`,options:n,metadata:r,presentation:i},a);if(s.ok||s.status<500)return await this.renderResponse(s,e);await s.body?.cancel()}catch(t){if(t.name===`AbortError`||In(e))throw t}if(In(e))throw Error(`The ${e} renderer unit is unavailable.`)}let s=await this.renderRequest(`/render/v1/svg`,{engine:e,source:t,format:`svg`,options:n,metadata:r,presentation:i},a);return this.renderResponse(s,e)}renderRequest(e,t,n){return fetch(e,{method:`POST`,headers:{Accept:`image/svg+xml`,"Content-Type":`application/json`},body:JSON.stringify(t),signal:n})}async renderResponse(e,t){if(!e.ok)throw Error(await this.errorMessage(e));this.status.dataset.cache=e.headers.get(`X-Diagram-Cache`)?.toLowerCase()??`miss`,this.status.dataset.renderer=e.headers.get(`X-Diagram-Unit`)?.toLowerCase()??e.headers.get(`X-Diagram-Renderer`)?.toLowerCase()??`gateway`;let n=e.headers.get(`X-Diagram-Unit`)?.toLowerCase()??e.headers.get(`X-Diagram-Engine`)?.toLowerCase()??t,r=e.headers.get(`X-Renderer-Build`)??e.headers.get(`X-Diagram-Engine-Version`)??`${n}-unknown`,i=(e.headers.get(`X-Diagram-Pipeline`)??n).split(`,`).map(e=>e.trim().toLowerCase()).filter(Boolean);return{body:await e.text(),identity:{unit:n,build:r,pipeline:i}}}retryBlockedImage(){if(this.image.src===this.activeImageUrl){if(this.imageFallbackUrl&&this.activeImageUrl.startsWith(`blob:`)){let e=this.imageFallbackUrl;this.imageFallbackUrl=null,this.objectUrl&&URL.revokeObjectURL(this.objectUrl),this.objectUrl=null,this.activeImageUrl=e,this.image.src=e,this.minimapImage.src=e;return}this.setStatus(`The rendered image was blocked or invalid.`,`error`)}}svgBlobFor(e){let{type:t,source:n,options:r={},meta:i={},presentation:a={}}=e,o=JSON.stringify({type:t,source:n,options:r,meta:i,presentation:a});return this.latestRenderKey===o?this.latestSvgBlob:null}rendererIdentityFor(e){let{type:t,source:n,options:r={},meta:i={},presentation:a={}}=e,o=JSON.stringify({type:t,source:n,options:r,meta:i,presentation:a});return this.latestRenderKey===o?this.latestRendererIdentity:null}async errorMessage(e){let t=await e.text();if(e.headers.get(`Content-Type`)?.includes(`application/json`))try{let e=JSON.parse(t);if(typeof e?.error?.message==`string`)return e.error.message}catch{}return new DOMParser().parseFromString(t,`text/html`).body.textContent.trim().replace(/\s+/g,` `)||`Render failed with HTTP ${e.status}.`}normalizedSvgBlob(e){let t=new DOMParser().parseFromString(e,`image/svg+xml`).documentElement,n=t.getAttribute(`viewBox`)?.trim().split(/[\s,]+/).map(Number);t.nodeName===`svg`&&n?.length===4&&n.every(Number.isFinite)&&(t.hasAttribute(`width`)||t.setAttribute(`width`,String(n[2])),t.hasAttribute(`height`)||t.setAttribute(`height`,String(n[3])),e=new XMLSerializer().serializeToString(t));let r=t.style.backgroundColor||t.style.background,i=r&&r!==`transparent`?r:`#ffffff`;return{blob:new Blob([e],{type:`image/svg+xml`}),background:i}}setStatus(e,t){this.status.textContent=e,this.status.dataset.state=t}zoom(e){if(this.image.hidden)return;let t=this.stage.getBoundingClientRect();this.zoomAt(e,t.width/2,t.height/2)}zoomAt(e,t,n){let r=W(this.scale*e,.1,8),i=(t-this.x)/this.scale,a=(n-this.y)/this.scale;this.x=t-i*r,this.y=n-a*r,this.scale=r,this.updateTransform()}wheelZoom(e){if(this.image.hidden||e.target.closest(`.preview-toolbar, .minimap`))return;e.preventDefault();let t=this.stage.getBoundingClientRect(),n=e.deltaY*(e.deltaMode===WheelEvent.DOM_DELTA_LINE?16:e.deltaMode===WheelEvent.DOM_DELTA_PAGE?t.height:1);this.zoomAt(Math.exp(-W(n,-240,240)*.002),e.clientX-t.left,e.clientY-t.top)}oneToOne(){if(this.image.hidden)return;let e=this.stage.getBoundingClientRect();this.scale=1,this.x=(e.width-this.image.naturalWidth)/2,this.y=(e.height-this.image.naturalHeight)/2,this.updateTransform()}fit(){if(!this.image.naturalWidth||!this.image.naturalHeight)return;let e=this.stage.getBoundingClientRect(),t=Math.min(64,e.width*.12);this.scale=W(Math.min((e.width-t*2)/this.image.naturalWidth,(e.height-t*2)/this.image.naturalHeight),.1,2),this.x=(e.width-this.image.naturalWidth*this.scale)/2,this.y=(e.height-this.image.naturalHeight*this.scale)/2,this.updateTransform()}updateTransform(){this.image.style.transform=`translate(${this.x}px, ${this.y}px) scale(${this.scale})`,this.updateMinimap()}startPan(e){this.image.hidden||e.button!==0||e.target.closest(`.preview-toolbar, .minimap`)||(this.drag={pointerId:e.pointerId,x:e.clientX,y:e.clientY,originX:this.x,originY:this.y},this.stage.setPointerCapture(e.pointerId),this.stage.dataset.dragging=`true`)}pan(e){!this.drag||e.pointerId!==this.drag.pointerId||(this.x=this.drag.originX+e.clientX-this.drag.x,this.y=this.drag.originY+e.clientY-this.drag.y,this.updateTransform())}endPan(e){!this.drag||e.pointerId!==this.drag.pointerId||(this.drag=null,delete this.stage.dataset.dragging)}moveFromMinimap(e){if(!this.image.naturalWidth||!this.image.naturalHeight)return;let t=this.minimap.getBoundingClientRect(),n=Math.min(t.width/this.image.naturalWidth,t.height/this.image.naturalHeight),r=(t.width-this.image.naturalWidth*n)/2,i=(t.height-this.image.naturalHeight*n)/2,a=(e.clientX-t.left-r)/n,o=(e.clientY-t.top-i)/n,s=this.stage.getBoundingClientRect();this.x=s.width/2-a*this.scale,this.y=s.height/2-o*this.scale,this.updateTransform()}updateMinimap(){if(!this.image.naturalWidth||!this.image.naturalHeight)return;let e=this.stage.getBoundingClientRect(),t=this.image.naturalWidth*this.scale,n=this.image.naturalHeight*this.scale,r=this.x>=0&&this.y>=0&&this.x+t<=e.width&&this.y+n<=e.height;if(this.minimap.hidden=r,r)return;let i=this.minimap.getBoundingClientRect(),a=Math.min(i.width/this.image.naturalWidth,i.height/this.image.naturalHeight),o=(i.width-this.image.naturalWidth*a)/2,s=(i.height-this.image.naturalHeight*a)/2,c=W(-this.x/this.scale,0,this.image.naturalWidth),l=W(-this.y/this.scale,0,this.image.naturalHeight),u=W((e.width-this.x)/this.scale,0,this.image.naturalWidth),d=W((e.height-this.y)/this.scale,0,this.image.naturalHeight);this.minimapViewport.style.left=`${o+c*a}px`,this.minimapViewport.style.top=`${s+l*a}px`,this.minimapViewport.style.width=`${Math.max(4,(u-c)*a)}px`,this.minimapViewport.style.height=`${Math.max(4,(d-l)*a)}px`}},zn=`diagram.zip:draft:local:v2`,G=`diagram.zip:draft:alias:v1:`,Bn=`diagram.zip:write:v1:`,K=new Et,Vn,Hn,q=!1,Un=``,J={aliasId:null,contentId:null,renderId:null,revision:null,mode:`open`,savedMode:null,writeCapability:null,savedState:null,savedSnapshot:null,bundleKey:null,keyEnvelope:null,encryptedContent:null,encryptedMetadata:null,keyEnvelopeDirty:!1,dirty:!0},Wn=new Map;document.querySelector(`#app`).innerHTML=`
========
${h}.`);break;case m:switch(t){case`xml`:break;case``:e.fail(`the default namespace may not be set to ${n}.`);break;default:e.fail(`may not assign the xml namespace to another prefix.`)}}}function L(e,t){for(let n of Object.keys(t))$e(e,n,t[n])}var et=e=>p.test(e),tt=e=>l.test(e),R=0,nt=1,rt=2;e.EVENTS=[`xmldecl`,`text`,`processinginstruction`,`doctype`,`comment`,`opentagstart`,`attribute`,`opentag`,`closetag`,`cdata`,`error`,`end`,`ready`];var z={xmldecl:`xmldeclHandler`,text:`textHandler`,processinginstruction:`piHandler`,doctype:`doctypeHandler`,comment:`commentHandler`,opentagstart:`openTagStartHandler`,attribute:`attributeHandler`,opentag:`openTagHandler`,closetag:`closeTagHandler`,cdata:`cdataHandler`,error:`errorHandler`,end:`endHandler`,ready:`readyHandler`};e.SaxesParser=class{constructor(e){this.opt=e??{},this.fragmentOpt=!!this.opt.fragment;let t=this.xmlnsOpt=!!this.opt.xmlns;if(this.trackPosition=this.opt.position!==!1,this.fileName=this.opt.fileName,t){this.nameStartCheck=d,this.nameCheck=f,this.isName=et,this.processAttribs=this.processAttribsNS,this.pushAttrib=this.pushAttribNS,this.ns=Object.assign({__proto__:null},ee);let e=this.opt.additionalNamespaces;e!=null&&(L(this,e),Object.assign(this.ns,e))}else this.nameStartCheck=o,this.nameCheck=s,this.isName=tt,this.processAttribs=this.processAttribsPlain,this.pushAttrib=this.pushAttribPlain;this.stateTable=[this.sBegin,this.sBeginWhitespace,this.sDoctype,this.sDoctypeQuote,this.sDTD,this.sDTDQuoted,this.sDTDOpenWaka,this.sDTDOpenWakaBang,this.sDTDComment,this.sDTDCommentEnding,this.sDTDCommentEnded,this.sDTDPI,this.sDTDPIEnding,this.sText,this.sEntity,this.sOpenWaka,this.sOpenWakaBang,this.sComment,this.sCommentEnding,this.sCommentEnded,this.sCData,this.sCDataEnding,this.sCDataEnding2,this.sPIFirstChar,this.sPIRest,this.sPIBody,this.sPIEnding,this.sXMLDeclNameStart,this.sXMLDeclName,this.sXMLDeclEq,this.sXMLDeclValueStart,this.sXMLDeclValue,this.sXMLDeclSeparator,this.sXMLDeclEnding,this.sOpenTag,this.sOpenTagSlash,this.sAttrib,this.sAttribName,this.sAttribNameSawWhite,this.sAttribValue,this.sAttribValueQuoted,this.sAttribValueClosed,this.sAttribValueUnquoted,this.sCloseTag,this.sCloseTagSawWhite],this._init()}get closed(){return this._closed}_init(){var e;this.openWakaBang=``,this.text=``,this.name=``,this.piTarget=``,this.entity=``,this.q=null,this.tags=[],this.tag=null,this.topNS=null,this.chunk=``,this.chunkPosition=0,this.i=0,this.prevI=0,this.carriedFromPrevious=void 0,this.forbiddenState=R,this.attribList=[];let{fragmentOpt:t}=this;this.state=t?y:ne,this.reportedTextBeforeRoot=this.reportedTextAfterRoot=this.closedRoot=this.sawRoot=t,this.xmlDeclPossible=!t,this.xmlDeclExpects=[`version`],this.entityReturnState=void 0;let{defaultXMLVersion:n}=this.opt;if(n===void 0){if(this.opt.forceXMLVersion===!0)throw Error(`forceXMLVersion set but defaultXMLVersion is not set`);n=`1.0`}this.setXMLVersion(n),this.positionAtNewLine=0,this.doctype=!1,this._closed=!1,this.xmlDecl={version:void 0,encoding:void 0,standalone:void 0},this.line=1,this.column=0,this.ENTITIES=Object.create(te),(e=this.readyHandler)==null||e.call(this)}get position(){return this.chunkPosition+this.i}get columnIndex(){return this.position-this.positionAtNewLine}on(e,t){this[z[e]]=t}off(e){this[z[e]]=void 0}makeError(e){let t=this.fileName??``;return this.trackPosition&&(t.length>0&&(t+=`:`),t+=`${this.line}:${this.column}`),t.length>0&&(t+=`: `),Error(t+e)}fail(e){let t=this.makeError(e),n=this.errorHandler;if(n===void 0)throw t;return n(t),this}write(e){if(this.closed)return this.fail(`cannot write after close; assign an onready handler.`);let t=!1;e===null?(t=!0,e=``):typeof e==`object`&&(e=e.toString()),this.carriedFromPrevious!==void 0&&(e=`${this.carriedFromPrevious}${e}`,this.carriedFromPrevious=void 0);let n=e.length,r=e.charCodeAt(n-1);!t&&(r===Ve||r>=55296&&r<=56319)&&(this.carriedFromPrevious=e[n-1],n--,e=e.slice(0,n));let{stateTable:i}=this;for(this.chunk=e,this.i=0;this.i<n;)i[this.state].call(this);return this.chunkPosition+=n,t?this.end():this}close(){return this.write(null)}getCode10(){let{chunk:e,i:t}=this;if(this.prevI=t,this.i=t+1,t>=e.length)return g;let n=e.charCodeAt(t);if(this.column++,n<55296){if(n>=He||n===Be)return n;switch(n){case T:return this.line++,this.column=0,this.positionAtNewLine=this.position,T;case Ve:return e.charCodeAt(t+1)===T&&(this.i=t+2),this.line++,this.column=0,this.positionAtNewLine=this.position,_;default:return this.fail(`disallowed character.`),n}}if(n>56319)return n>=57344&&n<=65533||this.fail(`disallowed character.`),n;let r=65536+(n-55296)*1024+(e.charCodeAt(t+1)-56320);return this.i=t+2,r>1114111&&this.fail(`disallowed character.`),r}getCode11(){let{chunk:e,i:t}=this;if(this.prevI=t,this.i=t+1,t>=e.length)return g;let n=e.charCodeAt(t);if(this.column++,n<55296){if(n>31&&n<127||n>159&&n!==P||n===Be)return n;switch(n){case T:return this.line++,this.column=0,this.positionAtNewLine=this.position,T;case Ve:{let n=e.charCodeAt(t+1);(n===T||n===N)&&(this.i=t+2)}case N:case P:return this.line++,this.column=0,this.positionAtNewLine=this.position,_;default:return this.fail(`disallowed character.`),n}}if(n>56319)return n>=57344&&n<=65533||this.fail(`disallowed character.`),n;let r=65536+(n-55296)*1024+(e.charCodeAt(t+1)-56320);return this.i=t+2,r>1114111&&this.fail(`disallowed character.`),r}getCodeNorm(){let e=this.getCode();return e===_?T:e}unget(){this.i=this.prevI,this.column--}captureTo(e){let{i:t}=this,{chunk:n}=this;for(;;){let r=this.getCode(),i=r===_,a=i?T:r;if(a===g||e.includes(a))return this.text+=n.slice(t,this.prevI),a;i&&(this.text+=`${n.slice(t,this.prevI)}\n`,t=this.i)}}captureToChar(e){let{i:t}=this,{chunk:n}=this;for(;;){let r=this.getCode();switch(r){case _:this.text+=`${n.slice(t,this.prevI)}\n`,t=this.i,r=T;break;case g:return this.text+=n.slice(t),!1}if(r===e)return this.text+=n.slice(t,this.prevI),!0}}captureNameChars(){let{chunk:e,i:t}=this;for(;;){let n=this.getCode();if(n===g)return this.name+=e.slice(t),g;if(!s(n))return this.name+=e.slice(t,this.prevI),n===_?T:n}}skipSpaces(){for(;;){let e=this.getCodeNorm();if(e===g||!i(e))return e}}setXMLVersion(e){this.currentXMLVersion=e,e===`1.0`?(this.isChar=a,this.getCode=this.getCode10):(this.isChar=u,this.getCode=this.getCode11)}sBegin(){this.chunk.charCodeAt(0)===65279&&(this.i++,this.column++),this.state=re}sBeginWhitespace(){let e=this.i,t=this.skipSpaces();switch(this.prevI!==e&&(this.xmlDeclPossible=!1),t){case D:if(this.state=he,this.text.length!==0)throw Error(`no-empty text at start`);break;case g:break;default:this.unget(),this.state=y,this.xmlDeclPossible=!1}}sDoctype(){var e;let t=this.captureTo(Xe);switch(t){case k:(e=this.doctypeHandler)==null||e.call(this,this.text),this.text=``,this.state=y,this.doctype=!0;break;case g:break;default:this.text+=String.fromCodePoint(t),t===j?this.state=v:F(t)&&(this.state=ae,this.q=t)}}sDoctypeQuote(){let e=this.q;this.captureToChar(e)&&(this.text+=String.fromCodePoint(e),this.q=null,this.state=ie)}sDTD(){let e=this.captureTo(Ze);e!==g&&(this.text+=String.fromCodePoint(e),e===M?this.state=ie:e===D?this.state=se:F(e)&&(this.state=oe,this.q=e))}sDTDQuoted(){let e=this.q;this.captureToChar(e)&&(this.text+=String.fromCodePoint(e),this.state=v,this.q=null)}sDTDOpenWaka(){let e=this.getCodeNorm();switch(this.text+=String.fromCodePoint(e),e){case Ue:this.state=ce,this.openWakaBang=``;break;case A:this.state=fe;break;default:this.state=v}}sDTDOpenWakaBang(){let e=String.fromCodePoint(this.getCodeNorm()),t=this.openWakaBang+=e;this.text+=e,t!==`-`&&(this.state=t===`--`?le:v,this.openWakaBang=``)}sDTDComment(){this.captureToChar(qe)&&(this.text+=`-`,this.state=ue)}sDTDCommentEnding(){let e=this.getCodeNorm();this.text+=String.fromCodePoint(e),this.state=e===qe?de:le}sDTDCommentEnded(){let e=this.getCodeNorm();this.text+=String.fromCodePoint(e),e===k?this.state=v:(this.fail(`malformed comment.`),this.state=le)}sDTDPI(){this.captureToChar(A)&&(this.text+=`?`,this.state=pe)}sDTDPIEnding(){let e=this.getCodeNorm();this.text+=String.fromCodePoint(e),e===k&&(this.state=v)}sText(){this.tags.length===0?this.handleTextOutsideRoot():this.handleTextInRoot()}sEntity(){let{i:e}=this,{chunk:t}=this;loop:for(;;)switch(this.getCode()){case _:this.entity+=`${t.slice(e,this.prevI)}\n`,e=this.i;break;case Je:{let{entityReturnState:n}=this,r=this.entity+t.slice(e,this.prevI);this.state=n;let i;r===``?(this.fail(`empty entity name.`),i=`&;`):(i=this.parseEntity(r),this.entity=``),(n!==y||this.textHandler!==void 0)&&(this.text+=i);break loop}case g:this.entity+=t.slice(e);break loop}}sOpenWaka(){let e=this.getCode();if(o(e))this.state=Ne,this.unget(),this.xmlDeclPossible=!1;else switch(e){case E:this.state=Re,this.xmlDeclPossible=!1;break;case Ue:this.state=ge,this.openWakaBang=``,this.xmlDeclPossible=!1;break;case A:this.state=Ce;break;default:this.fail(`disallowed character in tag name`),this.state=y,this.xmlDeclPossible=!1}}sOpenWakaBang(){switch(this.openWakaBang+=String.fromCodePoint(this.getCodeNorm()),this.openWakaBang){case`[CDATA[`:!this.sawRoot&&!this.reportedTextBeforeRoot&&(this.fail(`text data outside of root node.`),this.reportedTextBeforeRoot=!0),this.closedRoot&&!this.reportedTextAfterRoot&&(this.fail(`text data outside of root node.`),this.reportedTextAfterRoot=!0),this.state=be,this.openWakaBang=``;break;case`--`:this.state=_e,this.openWakaBang=``;break;case`DOCTYPE`:this.state=ie,(this.doctype||this.sawRoot)&&this.fail(`inappropriately located doctype declaration.`),this.openWakaBang=``;break;default:this.openWakaBang.length>=7&&this.fail(`incorrect syntax.`)}}sComment(){this.captureToChar(qe)&&(this.state=ve)}sCommentEnding(){var e;let t=this.getCodeNorm();t===qe?(this.state=ye,(e=this.commentHandler)==null||e.call(this,this.text),this.text=``):(this.text+=`-${String.fromCodePoint(t)}`,this.state=_e)}sCommentEnded(){let e=this.getCodeNorm();e===k?this.state=y:(this.fail(`malformed comment.`),this.text+=`--${String.fromCodePoint(e)}`,this.state=_e)}sCData(){this.captureToChar(M)&&(this.state=xe)}sCDataEnding(){let e=this.getCodeNorm();e===M?this.state=Se:(this.text+=`]${String.fromCodePoint(e)}`,this.state=be)}sCDataEnding2(){var e;let t=this.getCodeNorm();switch(t){case k:(e=this.cdataHandler)==null||e.call(this,this.text),this.text=``,this.state=y;break;case M:this.text+=`]`;break;default:this.text+=`]]${String.fromCodePoint(t)}`,this.state=be}}sPIFirstChar(){let e=this.getCodeNorm();this.nameStartCheck(e)?(this.piTarget+=String.fromCodePoint(e),this.state=we):e===A||i(e)?(this.fail(`processing instruction without a target.`),this.state=e===A?Ee:Te):(this.fail(`disallowed character in processing instruction name.`),this.piTarget+=String.fromCodePoint(e),this.state=we)}sPIRest(){let{chunk:e,i:t}=this;for(;;){let n=this.getCodeNorm();if(n===g){this.piTarget+=e.slice(t);return}if(!this.nameCheck(n)){this.piTarget+=e.slice(t,this.prevI);let r=n===A;r||i(n)?this.piTarget===`xml`?(this.xmlDeclPossible||this.fail(`an XML declaration must be at the start of the document.`),this.state=r?b:De):this.state=r?Ee:Te:(this.fail(`disallowed character in processing instruction name.`),this.piTarget+=String.fromCodePoint(n));break}}}sPIBody(){if(this.text.length===0){let e=this.getCodeNorm();e===A?this.state=Ee:i(e)||(this.text=String.fromCodePoint(e))}else this.captureToChar(A)&&(this.state=Ee)}sPIEnding(){var e;let t=this.getCodeNorm();if(t===k){let{piTarget:t}=this;t.toLowerCase()===`xml`&&this.fail(`the XML declaration must appear at the start of the document.`),(e=this.piHandler)==null||e.call(this,{target:t,body:this.text}),this.piTarget=this.text=``,this.state=y}else t===A?this.text+=`?`:(this.text+=`?${String.fromCodePoint(t)}`,this.state=Te);this.xmlDeclPossible=!1}sXMLDeclNameStart(){let e=this.skipSpaces();if(e===A){this.state=b;return}e!==g&&(this.state=Oe,this.name=String.fromCodePoint(e))}sXMLDeclName(){let e=this.captureTo(Qe);if(e===A){this.state=b,this.name+=this.text,this.text=``,this.fail(`XML declaration is incomplete.`);return}if(i(e)||e===O){if(this.name+=this.text,this.text=``,!this.xmlDeclExpects.includes(this.name))switch(this.name.length){case 0:this.fail(`did not expect any more name/value pairs.`);break;case 1:this.fail(`expected the name ${this.xmlDeclExpects[0]}.`);break;default:this.fail(`expected one of ${this.xmlDeclExpects.join(`, `)}`)}this.state=e===O?Ae:ke}}sXMLDeclEq(){let e=this.getCodeNorm();if(e===A){this.state=b,this.fail(`XML declaration is incomplete.`);return}i(e)||(e!==O&&this.fail(`value required.`),this.state=Ae)}sXMLDeclValueStart(){let e=this.getCodeNorm();if(e===A){this.state=b,this.fail(`XML declaration is incomplete.`);return}i(e)||(F(e)?this.q=e:(this.fail(`value must be quoted.`),this.q=He),this.state=je)}sXMLDeclValue(){let e=this.captureTo([this.q,A]);if(e===A){this.state=b,this.text=``,this.fail(`XML declaration is incomplete.`);return}if(e===g)return;let t=this.text;switch(this.text=``,this.name){case`version`:{this.xmlDeclExpects=[`encoding`,`standalone`];let e=t;this.xmlDecl.version=e,/^1\.[0-9]+$/.test(e)?this.opt.forceXMLVersion||this.setXMLVersion(e):this.fail(`version number must match /^1\\.[0-9]+$/.`);break}case`encoding`:/^[A-Za-z][A-Za-z0-9._-]*$/.test(t)||this.fail(`encoding value must match /^[A-Za-z0-9][A-Za-z0-9._-]*$/.`),this.xmlDeclExpects=[`standalone`],this.xmlDecl.encoding=t;break;case`standalone`:t!==`yes`&&t!==`no`&&this.fail(`standalone value must match "yes" or "no".`),this.xmlDeclExpects=[],this.xmlDecl.standalone=t}this.name=``,this.state=Me}sXMLDeclSeparator(){let e=this.getCodeNorm();if(e===A){this.state=b;return}i(e)||(this.fail(`whitespace required.`),this.unget()),this.state=De}sXMLDeclEnding(){var e;this.getCodeNorm()===k?(this.piTarget===`xml`?this.name!==`version`&&this.xmlDeclExpects.includes(`version`)&&this.fail(`XML declaration must contain a version.`):this.fail(`processing instructions are not allowed before root.`),(e=this.xmldeclHandler)==null||e.call(this,this.xmlDecl),this.name=``,this.piTarget=this.text=``,this.state=y):this.fail(`The character ? is disallowed anywhere in XML declarations.`),this.xmlDeclPossible=!1}sOpenTag(){var e;let t=this.captureNameChars();if(t===g)return;let n=this.tag={name:this.name,attributes:Object.create(null)};switch(this.name=``,this.xmlnsOpt&&(this.topNS=n.ns=Object.create(null)),(e=this.openTagStartHandler)==null||e.call(this,n),this.sawRoot=!0,!this.fragmentOpt&&this.closedRoot&&this.fail(`documents may contain only one root.`),t){case k:this.openTag();break;case E:this.state=Pe;break;default:i(t)||this.fail(`disallowed character in tag name.`),this.state=x}}sOpenTagSlash(){this.getCode()===k?this.openSelfClosingTag():(this.fail(`forward-slash in opening tag not followed by >.`),this.state=x)}sAttrib(){let e=this.skipSpaces();e!==g&&(o(e)?(this.unget(),this.state=S):e===k?this.openTag():e===E?this.state=Pe:this.fail(`disallowed character in attribute name.`))}sAttribName(){let e=this.captureNameChars();e===O?this.state=w:i(e)?this.state=C:e===k?(this.fail(`attribute without value.`),this.pushAttrib(this.name,this.name),this.name=this.text=``,this.openTag()):e!==g&&this.fail(`disallowed character in attribute name.`)}sAttribNameSawWhite(){let e=this.skipSpaces();switch(e){case g:return;case O:this.state=w;break;default:this.fail(`attribute without value.`),this.text=``,this.name=``,e===k?this.openTag():o(e)?(this.unget(),this.state=S):(this.fail(`disallowed character in attribute name.`),this.state=x)}}sAttribValue(){let e=this.getCodeNorm();F(e)?(this.q=e,this.state=Fe):i(e)||(this.fail(`unquoted attribute value.`),this.state=Le,this.unget())}sAttribValueQuoted(){let{q:e,chunk:t}=this,{i:n}=this;for(;;)switch(this.getCode()){case e:this.pushAttrib(this.name,this.text+t.slice(n,this.prevI)),this.name=this.text=``,this.q=null,this.state=Ie;return;case Ge:this.text+=t.slice(n,this.prevI),this.state=me,this.entityReturnState=Fe;return;case T:case _:case Be:this.text+=`${t.slice(n,this.prevI)} `,n=this.i;break;case D:this.text+=t.slice(n,this.prevI),this.fail(`disallowed character.`);return;case g:this.text+=t.slice(n);return}}sAttribValueClosed(){let e=this.getCodeNorm();i(e)?this.state=x:e===k?this.openTag():e===E?this.state=Pe:o(e)?(this.fail(`no whitespace between attributes.`),this.unget(),this.state=S):this.fail(`disallowed character in attribute name.`)}sAttribValueUnquoted(){let e=this.captureTo(I);switch(e){case Ge:this.state=me,this.entityReturnState=Le;break;case D:this.fail(`disallowed character.`);break;case g:break;default:this.text.includes(`]]>`)&&this.fail(`the string "]]>" is disallowed in char data.`),this.pushAttrib(this.name,this.text),this.name=this.text=``,e===k?this.openTag():this.state=x}}sCloseTag(){let e=this.captureNameChars();e===k?this.closeTag():i(e)?this.state=ze:e!==g&&this.fail(`disallowed character in closing tag.`)}sCloseTagSawWhite(){switch(this.skipSpaces()){case k:this.closeTag();break;case g:break;default:this.fail(`disallowed character in closing tag.`)}}handleTextInRoot(){let{i:e,forbiddenState:t}=this,{chunk:n,textHandler:r}=this;scanLoop:for(;;)switch(this.getCode()){case D:if(this.state=he,r!==void 0){let{text:t}=this,i=n.slice(e,this.prevI);t.length===0?i.length!==0&&r(i):(r(t+i),this.text=``)}t=R;break scanLoop;case Ge:this.state=me,this.entityReturnState=y,r!==void 0&&(this.text+=n.slice(e,this.prevI)),t=R;break scanLoop;case M:switch(t){case R:t=nt;break;case nt:t=rt;break;case rt:break;default:throw Error(`impossible state`)}break;case k:t===rt&&this.fail(`the string "]]>" is disallowed in char data.`),t=R;break;case _:r!==void 0&&(this.text+=`${n.slice(e,this.prevI)}\n`),e=this.i,t=R;break;case g:r!==void 0&&(this.text+=n.slice(e));break scanLoop;default:t=R}this.forbiddenState=t}handleTextOutsideRoot(){let{i:e}=this,{chunk:t,textHandler:n}=this,r=!1;outRootLoop:for(;;){let a=this.getCode();switch(a){case D:if(this.state=he,n!==void 0){let{text:r}=this,i=t.slice(e,this.prevI);r.length===0?i.length!==0&&n(i):(n(r+i),this.text=``)}break outRootLoop;case Ge:this.state=me,this.entityReturnState=y,n!==void 0&&(this.text+=t.slice(e,this.prevI)),r=!0;break outRootLoop;case _:n!==void 0&&(this.text+=`${t.slice(e,this.prevI)}\n`),e=this.i;break;case g:n!==void 0&&(this.text+=t.slice(e));break outRootLoop;default:i(a)||(r=!0)}}r&&(!this.sawRoot&&!this.reportedTextBeforeRoot&&(this.fail(`text data outside of root node.`),this.reportedTextBeforeRoot=!0),this.closedRoot&&!this.reportedTextAfterRoot&&(this.fail(`text data outside of root node.`),this.reportedTextAfterRoot=!0))}pushAttribNS(e,t){var n;let{prefix:r,local:i}=this.qname(e),a={name:e,prefix:r,local:i,value:t};if(this.attribList.push(a),(n=this.attributeHandler)==null||n.call(this,a),r===`xmlns`){let e=t.trim();this.currentXMLVersion===`1.0`&&e===``&&this.fail(`invalid attempt to undefine prefix in XML 1.0`),this.topNS[i]=e,$e(this,i,e)}else if(e===`xmlns`){let e=t.trim();this.topNS[``]=e,$e(this,``,e)}}pushAttribPlain(e,t){var n;let r={name:e,value:t};this.attribList.push(r),(n=this.attributeHandler)==null||n.call(this,r)}end(){var e,t;this.sawRoot||this.fail(`document must contain a root element.`);let{tags:n}=this;for(;n.length>0;){let e=n.pop();this.fail(`unclosed tag: ${e.name}`)}this.state!==ne&&this.state!==y&&this.fail(`unexpected end.`);let{text:r}=this;return r.length!==0&&((e=this.textHandler)==null||e.call(this,r),this.text=``),this._closed=!0,(t=this.endHandler)==null||t.call(this),this._init(),this}resolve(e){var t;let n=this.topNS[e];if(n!==void 0)return n;let{tags:r}=this;for(let t=r.length-1;t>=0;t--)if(n=r[t].ns[e],n!==void 0)return n;return n=this.ns[e],n===void 0?(t=this.opt).resolvePrefix?.call(t,e):n}qname(e){let t=e.indexOf(`:`);if(t===-1)return{prefix:``,local:e};let n=e.slice(t+1),r=e.slice(0,t);return(r===``||n===``||n.includes(`:`))&&this.fail(`malformed name: ${e}.`),{prefix:r,local:n}}processAttribsNS(){let{attribList:e}=this,t=this.tag;{let{prefix:e,local:n}=this.qname(t.name);t.prefix=e,t.local=n;let r=t.uri=this.resolve(e)??``;e!==``&&(e===`xmlns`&&this.fail(`tags may not have "xmlns" as prefix.`),r===``&&(this.fail(`unbound namespace prefix: ${JSON.stringify(e)}.`),t.uri=e))}if(e.length===0)return;let{attributes:n}=t,r=new Set;for(let t of e){let{name:e,prefix:i,local:a}=t,o,s;i===``?(o=e===`xmlns`?h:``,s=e):(o=this.resolve(i),o===void 0&&(this.fail(`unbound namespace prefix: ${JSON.stringify(i)}.`),o=i),s=`{${o}}${a}`),r.has(s)&&this.fail(`duplicate attribute: ${s}.`),r.add(s),t.uri=o,n[e]=t}this.attribList=[]}processAttribsPlain(){let{attribList:e}=this,t=this.tag.attributes;for(let{name:n,value:r}of e)t[n]!==void 0&&this.fail(`duplicate attribute: ${n}.`),t[n]=r;this.attribList=[]}openTag(){var e;this.processAttribs();let{tags:t}=this,n=this.tag;n.isSelfClosing=!1,(e=this.openTagHandler)==null||e.call(this,n),t.push(n),this.state=y,this.name=``}openSelfClosingTag(){var e,t;this.processAttribs();let{tags:n}=this,r=this.tag;r.isSelfClosing=!0,(e=this.openTagHandler)==null||e.call(this,r),(t=this.closeTagHandler)==null||t.call(this,r),(this.tag=n[n.length-1]??null)===null&&(this.closedRoot=!0),this.state=y,this.name=``}closeTag(){let{tags:e,name:t}=this;if(this.state=y,this.name=``,t===``){this.fail(`weird empty close tag.`),this.text+=`</>`;return}let n=this.closeTagHandler,r=e.length;for(;r-->0;){let r=this.tag=e.pop();if(this.topNS=r.ns,n?.(r),r.name===t)break;this.fail(`unexpected close tag.`)}r===0?this.closedRoot=!0:r<0&&(this.fail(`unmatched closing tag: ${t}.`),this.text+=`</${t}>`)}parseEntity(e){if(e[0]!==`#`){let t=this.ENTITIES[e];return t===void 0?(this.fail(this.isName(e)?`undefined entity.`:`disallowed character in entity name.`),`&${e};`):t}let t=NaN;return e[1]===`x`&&/^#x[0-9a-f]+$/i.test(e)?t=parseInt(e.slice(2),16):/^#[0-9]+$/.test(e)&&(t=parseInt(e.slice(1),10)),this.isChar(t)?String.fromCodePoint(t):(this.fail(`malformed character entity.`),`&${e};`)}}}))(),cn=4194304,ln=new Set([`script`,`iframe`,`object`,`embed`,`audio`,`video`]),un=new Set([`foreignobject`,`div`,`span`,`p`,`br`,`b`,`strong`,`i`,`em`,`small`,`sub`,`sup`,`code`,`ul`,`ol`,`li`,`a`]),dn=/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i,fn=/^data:(?:font\/(?:woff2?|opentype|truetype)|application\/(?:x-)?font-woff2?);base64,[a-z0-9+/=\s]+$/i,pn=class extends Error{constructor(e){super(e),this.name=`ClientSvgError`}};function mn(e){let t=e.trim();return t.startsWith(`#`)||dn.test(t)||fn.test(t)}function hn(e){if(/@import|expression\s*\(|javascript\s*:|data\s*:\s*text\/html|behavior\s*:|-moz-binding/i.test(e))return!0;let t=/url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi;for(let n of e.matchAll(t))if(!mn(n[2]??``))return!0;return/url\s*\(/i.test(e.replace(t,``))}function gn(e){let t=e.trim();return t.startsWith(`#`)||dn.test(t)}function _n(e,t){let n=e.toLowerCase();return n.startsWith(`on`)?!1:n===`href`||n===`xlink:href`||n===`src`?gn(t):[`style`,`filter`,`fill`,`stroke`,`clip-path`,`mask`].includes(n)?!hn(t):n!==`xml:base`&&!/javascript\s*:/i.test(t)}function vn(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`)}function yn(e){return vn(e).replaceAll(`"`,`&quot;`)}function bn(e){if(e.type===`text`)return vn(e.value);let t=[...e.attributes].map(([e,t])=>` ${e}="${yn(t)}"`).join(``);return`<${e.name}${t}>${e.children.map(bn).join(``)}</${e.name}>`}function xn(e){return e.name.toLowerCase().split(`:`).at(-1)??e.name.toLowerCase()}function Sn(e){if(e===void 0||!/^-?\d+(?:\.\d+)?(?:px)?$/.test(e.trim()))return null;let t=Number.parseFloat(e);return Number.isFinite(t)&&t>0?t:null}function Cn(e){let t=e.attributes.get(`viewBox`)?.trim().split(/[\s,]+/).map(Number);if(t?.length===4&&t.every(Number.isFinite)&&t[2]>0&&t[3]>0)return t;let n=Sn(e.attributes.get(`width`)),r=Sn(e.attributes.get(`height`));return n!==null&&r!==null?[0,0,n,r]:null}function wn(e,t){let n=e.attributes.get(`style`);if(!n)return null;for(let e of n.split(`;`)){let n=e.indexOf(`:`);if(n>=0&&e.slice(0,n).trim().toLowerCase()===t)return e.slice(n+1).trim()}return null}function Tn(e){let t=(e.attributes.get(`fill`)??wn(e,`fill`)??``).replaceAll(` `,``).toLowerCase();return t===`white`||t===`#fff`||t===`#ffffff`||t===`rgb(255,255,255)`}function En(e){if(e===void 0||!/^-?\d+(?:\.\d+)?$/.test(e.trim()))return null;let t=Number(e);return Number.isFinite(t)?t:null}function Dn(e,t){let n=e.attributes.get(`width`)?.trim(),r=e.attributes.get(`height`)?.trim();if(n===`100%`&&r===`100%`)return!0;let i=En(e.attributes.get(`x`)??`0`),a=En(e.attributes.get(`y`)??`0`),o=En(n),s=En(r);if([i,a,o,s].some(e=>e===null))return!1;let[c,l,u,d]=t,f=.01;return i<=c+f&&a<=l+f&&i+o>=c+u-f&&a+s>=l+d-f}function On(e,t,n){let r=xn(e),i=new Set((e.attributes.get(`class`)??``).toLowerCase().split(/\s+/));return r===`rect`&&i.has(`backdrop`)||r===`rect`&&t!==null&&Tn(e)&&Dn(e,t)?!0:n===`graphviz`&&r===`polygon`&&Tn(e)&&(e.attributes.get(`stroke`)??``).toLowerCase()===`none`}function kn(e,t,n){let r=xn(e)===`svg`?Cn(e)??t:t;e.children=e.children.filter(e=>e.type===`text`||!On(e,r,n)&&(kn(e,r,n),!0))}function An(e,t){let n=(e.attributes.get(`style`)??``).split(`;`).map(e=>e.trim()).filter(Boolean).filter(e=>!/^background(?:-color)?\s*:/i.test(e));n.push(`background-color:${t}`),e.attributes.set(`style`,`${n.join(`;`)};`)}function jn(e,t=[],n=[]){return{type:`element`,name:e,attributes:new Map(t),children:n}}function Mn(e,t,n,r){let i=[],a=null;t.title&&i.push(jn(`title`,[],[{type:`text`,value:t.title}])),t.description&&i.push(jn(`desc`,[],[{type:`text`,value:t.description}]));let o=Cn(e);if((n.padding||n.background||n.frame)&&o===null)throw new pn(`Renderer output has no usable SVG dimensions for presentation settings.`);if(o!==null){let[t,r,s,c]=o,l=n.padding,u=[t-l,r-l,s+l*2,c+l*2];e.attributes.set(`viewBox`,u.join(` `)),e.attributes.has(`width`)&&e.attributes.set(`width`,String(u[2])),e.attributes.has(`height`)&&e.attributes.set(`height`,String(u[3])),n.background&&i.push(jn(`rect`,[[`x`,String(u[0])],[`y`,String(u[1])],[`width`,String(u[2])],[`height`,String(u[3])],[`fill`,n.background]])),n.frame&&(a=jn(`rect`,[[`x`,String(u[0]+.5)],[`y`,String(u[1]+.5)],[`width`,String(Math.max(0,u[2]-1))],[`height`,String(Math.max(0,u[3]-1))],[`fill`,`none`],[`stroke`,`#000000`],[`stroke-width`,`1`],[`vector-effect`,`non-scaling-stroke`]]))}n.background&&(kn(e,o,r),An(e,n.background)),e.children.unshift(...i),a&&e.children.push(a)}function Nn(e,t,n,r){if(e.length>cn)throw new pn(`Rendered SVG is too large.`);let i=null,a=[],o=0,s=null,c=new sn.SaxesParser({xmlns:!0});c.on(`doctype`,e=>{e.includes(`[`)&&(s=Error(`Internal DOCTYPE subsets are not allowed`))}),c.on(`opentag`,e=>{let t=e.local.toLowerCase(),n=t===`foreignobject`||a.some(e=>xn(e)===`foreignobject`);if(o>0||ln.has(t)||n&&!un.has(t)){o++;return}let r=jn(e.name);for(let t of Object.values(e.attributes))_n(t.name,t.value)&&r.attributes.set(t.name,t.value);let c=a.at(-1);c?c.children.push(r):i===null?i=r:s=Error(`Multiple root elements`),a.push(r)});let l=e=>{if(o>0||e===``)return;let t=a.at(-1);if(t){if(xn(t)===`style`&&hn(e))throw new pn(`Renderer output contains unsafe CSS.`);t.children.push({type:`text`,value:e})}else e.trim()!==``&&(s=Error(`Text outside root element`))};c.on(`text`,l),c.on(`cdata`,l),c.on(`closetag`,()=>{o>0?o--:a.pop()}),c.on(`error`,e=>{s=e});try{c.write(e).close()}catch(e){if(e instanceof pn)throw e;s=e}if(s!==null||i===null||xn(i)!==`svg`)throw new pn(`Renderer returned invalid SVG.`);return Mn(i,t,n,r),bn(i)}var Pn=Object.freeze({plantuml:`https://plantuml.render.diagram.zip/v1/svg`,graphviz:`https://graphviz.render.diagram.zip/v1/svg`,d2:`https://d2.render.diagram.zip/v1/svg`,c4plantuml:`https://c4plantuml.render.diagram.zip/v1/svg`,blockdiag:`https://blockdiag.render.diagram.zip/v1/svg`,seqdiag:`https://seqdiag.render.diagram.zip/v1/svg`,actdiag:`https://actdiag.render.diagram.zip/v1/svg`,nwdiag:`https://nwdiag.render.diagram.zip/v1/svg`,packetdiag:`https://packetdiag.render.diagram.zip/v1/svg`,rackdiag:`https://rackdiag.render.diagram.zip/v1/svg`,bytefield:`https://bytefield.render.diagram.zip/v1/svg`,dbml:`https://dbml.render.diagram.zip/v1/svg`,diagramsnet:`https://diagramsnet.render.diagram.zip/v1/svg`,ditaa:`https://ditaa.render.diagram.zip/v1/svg`,erd:`https://erd.render.diagram.zip/v1/svg`,goat:`https://goat.render.diagram.zip/v1/svg`,nomnoml:`https://nomnoml.render.diagram.zip/v1/svg`,pikchr:`https://pikchr.render.diagram.zip/v1/svg`,structurizr:`https://structurizr.render.diagram.zip/v1/svg`,svgbob:`https://svgbob.render.diagram.zip/v1/svg`,symbolator:`https://symbolator.render.diagram.zip/v1/svg`,tikz:`https://tikz.render.diagram.zip/v1/svg`,umlet:`https://umlet.render.diagram.zip/v1/svg`,vega:`https://vega.render.diagram.zip/v1/svg`,vegalite:`https://vegalite.render.diagram.zip/v1/svg`,wavedrom:`https://wavedrom.render.diagram.zip/v1/svg`,wireviz:`https://wireviz.render.diagram.zip/v1/svg`}),Fn=Object.freeze([`mermaid`,`bpmn`,`excalidraw`,`plantuml`,`c4plantuml`,`bytefield`,`nomnoml`,`vega`,`vegalite`,`wavedrom`,`blockdiag`,`seqdiag`,`actdiag`,`nwdiag`,`packetdiag`,`rackdiag`,`graphviz`,`erd`,`dbml`,`goat`,`pikchr`,`svgbob`,`wireviz`]);function In(e){return Fn.includes(e)}function Ln(e){return Pn[e]??null}function W(e,t,n){return Math.min(Math.max(e,t),n)}var Rn=class{constructor({stage:e,image:t,status:n,minimap:r,minimapImage:i,minimapViewport:a}){this.stage=e,this.image=t,this.status=n,this.minimap=r,this.minimapImage=i,this.minimapViewport=a,this.scale=1,this.x=0,this.y=0,this.objectUrl=null,this.abortController=null,this.requestNumber=0,this.pendingRender=null,this.renderLoop=null,this.latestRenderKey=null,this.latestSvgBlob=null,this.latestRendererIdentity=null,this.imageFallbackUrl=null,this.activeImageUrl=null,this.drag=null,this.image.addEventListener(`load`,()=>{this.image.src===this.activeImageUrl&&(this.imageFallbackUrl=null,this.setStatus(`Rendered`,`ready`),this.fit())}),this.image.addEventListener(`error`,()=>this.retryBlockedImage()),this.stage.addEventListener(`pointerdown`,e=>this.startPan(e)),this.stage.addEventListener(`pointermove`,e=>this.pan(e)),this.stage.addEventListener(`pointerup`,e=>this.endPan(e)),this.stage.addEventListener(`pointercancel`,e=>this.endPan(e)),this.stage.addEventListener(`wheel`,e=>this.wheelZoom(e),{passive:!1}),this.minimap.addEventListener(`pointerdown`,e=>this.moveFromMinimap(e)),new ResizeObserver(()=>this.updateTransform()).observe(this.stage)}render({type:e,source:t,options:n={},meta:r={},presentation:i={}}){if(!t.trim()){this.requestNumber++,this.pendingRender=null,this.abortController?.abort(),this.setStatus(`Write something to render.`,`idle`);return}let a=JSON.stringify({type:e,source:t,options:n,meta:r,presentation:i});return this.latestRenderKey===a&&this.latestSvgBlob?Promise.resolve():(this.pendingRender={type:e,source:t,options:n,meta:r,presentation:i,renderKey:a,requestNumber:++this.requestNumber},this.abortController?.abort(),this.renderLoop||=this.drainRenderQueue(),this.renderLoop)}async drainRenderQueue(){try{for(;this.pendingRender;){let e=this.pendingRender;this.pendingRender=null,await this.performRender(e)}}finally{this.renderLoop=null,this.pendingRender&&(this.renderLoop=this.drainRenderQueue())}}async performRender({type:e,source:t,options:n,meta:r,presentation:i,renderKey:a,requestNumber:o}){let s=new AbortController;this.abortController=s,this.setStatus(`Rendering…`,`loading`),this.stage.style.setProperty(`--render-background`,`var(--preview-bg)`);try{let c=nn(e),l;if(c)try{let a=await c.render({type:e,source:t,options:n},s.signal);l={body:Nn(a.body,r,i,e),identity:{unit:e,build:a.build||a.version,pipeline:Array.isArray(a.pipeline)?a.pipeline:[e]}},this.status.dataset.cache=`browser`,this.status.dataset.renderer=e}catch(a){if(a.name===`AbortError`||In(e))throw a;l=await this.renderThroughGateway({type:e,source:t,options:n,meta:r,presentation:i},s.signal)}else l=await this.renderThroughGateway({type:e,source:t,options:n,meta:r,presentation:i},s.signal);if(o!==this.requestNumber)return;let{blob:u,background:d}=this.normalizedSvgBlob(l.body);this.latestRenderKey=a,this.latestSvgBlob=u,this.latestRendererIdentity=l.identity,this.imageFallbackUrl=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(await u.text())}`,this.stage.style.setProperty(`--render-background`,d);let f=URL.createObjectURL(u),p=this.objectUrl;this.objectUrl=f,this.activeImageUrl=f,this.image.src=f,this.minimapImage.src=f,this.image.hidden=!1,this.setStatus(`Loading image…`,`loading`),p&&URL.revokeObjectURL(p)}catch(e){if(e.name===`AbortError`)return;this.setStatus(e.message||`Could not render this diagram.`,`error`)}finally{this.abortController===s&&(this.abortController=null)}}async renderThroughGateway({type:e,source:t,options:n,meta:r,presentation:i},a){let o=Ln(e);if(o){try{let s=await this.renderRequest(o,{source:t,format:`svg`,options:n,metadata:r,presentation:i},a);if(s.ok||s.status<500)return await this.renderResponse(s,e);await s.body?.cancel()}catch(t){if(t.name===`AbortError`||In(e))throw t}if(In(e))throw Error(`The ${e} renderer unit is unavailable.`)}let s=await this.renderRequest(`/render/v1/svg`,{engine:e,source:t,format:`svg`,options:n,metadata:r,presentation:i},a);return this.renderResponse(s,e)}renderRequest(e,t,n){return fetch(e,{method:`POST`,headers:{Accept:`image/svg+xml`,"Content-Type":`application/json`},body:JSON.stringify(t),signal:n})}async renderResponse(e,t){if(!e.ok)throw Error(await this.errorMessage(e));this.status.dataset.cache=e.headers.get(`X-Diagram-Cache`)?.toLowerCase()??`miss`,this.status.dataset.renderer=e.headers.get(`X-Diagram-Unit`)?.toLowerCase()??e.headers.get(`X-Diagram-Renderer`)?.toLowerCase()??`gateway`;let n=e.headers.get(`X-Diagram-Unit`)?.toLowerCase()??e.headers.get(`X-Diagram-Engine`)?.toLowerCase()??t,r=e.headers.get(`X-Renderer-Build`)??e.headers.get(`X-Diagram-Engine-Version`)??`${n}-unknown`,i=(e.headers.get(`X-Diagram-Pipeline`)??n).split(`,`).map(e=>e.trim().toLowerCase()).filter(Boolean);return{body:await e.text(),identity:{unit:n,build:r,pipeline:i}}}retryBlockedImage(){if(this.image.src===this.activeImageUrl){if(this.imageFallbackUrl&&this.activeImageUrl.startsWith(`blob:`)){let e=this.imageFallbackUrl;this.imageFallbackUrl=null,this.objectUrl&&URL.revokeObjectURL(this.objectUrl),this.objectUrl=null,this.activeImageUrl=e,this.image.src=e,this.minimapImage.src=e;return}this.setStatus(`The rendered image was blocked or invalid.`,`error`)}}svgBlobFor(e){let{type:t,source:n,options:r={},meta:i={},presentation:a={}}=e,o=JSON.stringify({type:t,source:n,options:r,meta:i,presentation:a});return this.latestRenderKey===o?this.latestSvgBlob:null}rendererIdentityFor(e){let{type:t,source:n,options:r={},meta:i={},presentation:a={}}=e,o=JSON.stringify({type:t,source:n,options:r,meta:i,presentation:a});return this.latestRenderKey===o?this.latestRendererIdentity:null}async errorMessage(e){let t=await e.text();if(e.headers.get(`Content-Type`)?.includes(`application/json`))try{let e=JSON.parse(t);if(typeof e?.error?.message==`string`)return e.error.message}catch{}return new DOMParser().parseFromString(t,`text/html`).body.textContent.trim().replace(/\s+/g,` `)||`Render failed with HTTP ${e.status}.`}normalizedSvgBlob(e){let t=new DOMParser().parseFromString(e,`image/svg+xml`).documentElement,n=t.getAttribute(`viewBox`)?.trim().split(/[\s,]+/).map(Number);t.nodeName===`svg`&&n?.length===4&&n.every(Number.isFinite)&&(t.hasAttribute(`width`)||t.setAttribute(`width`,String(n[2])),t.hasAttribute(`height`)||t.setAttribute(`height`,String(n[3])),e=new XMLSerializer().serializeToString(t));let r=t.style.backgroundColor||t.style.background,i=r&&r!==`transparent`?r:`#ffffff`;return{blob:new Blob([e],{type:`image/svg+xml`}),background:i}}setStatus(e,t){this.status.textContent=e,this.status.dataset.state=t}zoom(e){if(this.image.hidden)return;let t=this.stage.getBoundingClientRect();this.zoomAt(e,t.width/2,t.height/2)}zoomAt(e,t,n){let r=W(this.scale*e,.1,8),i=(t-this.x)/this.scale,a=(n-this.y)/this.scale;this.x=t-i*r,this.y=n-a*r,this.scale=r,this.updateTransform()}wheelZoom(e){if(this.image.hidden||e.target.closest(`.preview-toolbar, .minimap`))return;e.preventDefault();let t=this.stage.getBoundingClientRect(),n=e.deltaY*(e.deltaMode===WheelEvent.DOM_DELTA_LINE?16:e.deltaMode===WheelEvent.DOM_DELTA_PAGE?t.height:1);this.zoomAt(Math.exp(-W(n,-240,240)*.002),e.clientX-t.left,e.clientY-t.top)}oneToOne(){if(this.image.hidden)return;let e=this.stage.getBoundingClientRect();this.scale=1,this.x=(e.width-this.image.naturalWidth)/2,this.y=(e.height-this.image.naturalHeight)/2,this.updateTransform()}fit(){if(!this.image.naturalWidth||!this.image.naturalHeight)return;let e=this.stage.getBoundingClientRect(),t=Math.min(64,e.width*.12);this.scale=W(Math.min((e.width-t*2)/this.image.naturalWidth,(e.height-t*2)/this.image.naturalHeight),.1,2),this.x=(e.width-this.image.naturalWidth*this.scale)/2,this.y=(e.height-this.image.naturalHeight*this.scale)/2,this.updateTransform()}updateTransform(){this.image.style.transform=`translate(${this.x}px, ${this.y}px) scale(${this.scale})`,this.updateMinimap()}startPan(e){this.image.hidden||e.button!==0||e.target.closest(`.preview-toolbar, .minimap`)||(this.drag={pointerId:e.pointerId,x:e.clientX,y:e.clientY,originX:this.x,originY:this.y},this.stage.setPointerCapture(e.pointerId),this.stage.dataset.dragging=`true`)}pan(e){!this.drag||e.pointerId!==this.drag.pointerId||(this.x=this.drag.originX+e.clientX-this.drag.x,this.y=this.drag.originY+e.clientY-this.drag.y,this.updateTransform())}endPan(e){!this.drag||e.pointerId!==this.drag.pointerId||(this.drag=null,delete this.stage.dataset.dragging)}moveFromMinimap(e){if(!this.image.naturalWidth||!this.image.naturalHeight)return;let t=this.minimap.getBoundingClientRect(),n=Math.min(t.width/this.image.naturalWidth,t.height/this.image.naturalHeight),r=(t.width-this.image.naturalWidth*n)/2,i=(t.height-this.image.naturalHeight*n)/2,a=(e.clientX-t.left-r)/n,o=(e.clientY-t.top-i)/n,s=this.stage.getBoundingClientRect();this.x=s.width/2-a*this.scale,this.y=s.height/2-o*this.scale,this.updateTransform()}updateMinimap(){if(!this.image.naturalWidth||!this.image.naturalHeight)return;let e=this.stage.getBoundingClientRect(),t=this.image.naturalWidth*this.scale,n=this.image.naturalHeight*this.scale,r=this.x>=0&&this.y>=0&&this.x+t<=e.width&&this.y+n<=e.height;if(this.minimap.hidden=r,r)return;let i=this.minimap.getBoundingClientRect(),a=Math.min(i.width/this.image.naturalWidth,i.height/this.image.naturalHeight),o=(i.width-this.image.naturalWidth*a)/2,s=(i.height-this.image.naturalHeight*a)/2,c=W(-this.x/this.scale,0,this.image.naturalWidth),l=W(-this.y/this.scale,0,this.image.naturalHeight),u=W((e.width-this.x)/this.scale,0,this.image.naturalWidth),d=W((e.height-this.y)/this.scale,0,this.image.naturalHeight);this.minimapViewport.style.left=`${o+c*a}px`,this.minimapViewport.style.top=`${s+l*a}px`,this.minimapViewport.style.width=`${Math.max(4,(u-c)*a)}px`,this.minimapViewport.style.height=`${Math.max(4,(d-l)*a)}px`}},zn=`diagram.zip:draft:local:v2`,G=`diagram.zip:draft:alias:v1:`,Bn=`diagram.zip:write:v1:`,K=new Et,Vn,Hn,q=!1,Un=``,J={aliasId:null,contentId:null,renderId:null,revision:null,mode:`open`,savedMode:null,writeCapability:null,savedState:null,savedSnapshot:null,bundleKey:null,keyEnvelope:null,encryptedContent:null,encryptedMetadata:null,keyEnvelopeDirty:!1,dirty:!0},Wn=new Map;document.querySelector(`#app`).innerHTML=`
>>>>>>>> 0737bab1 (migrate PlantUML family to edge Wasm):server/src/main/resources/web/diagramzip/assets/index-Cv7q_F0Y.js
========
${h}.`);break;case m:switch(t){case`xml`:break;case``:e.fail(`the default namespace may not be set to ${n}.`);break;default:e.fail(`may not assign the xml namespace to another prefix.`)}}}function L(e,t){for(let n of Object.keys(t))$e(e,n,t[n])}var et=e=>p.test(e),tt=e=>l.test(e),R=0,nt=1,rt=2;e.EVENTS=[`xmldecl`,`text`,`processinginstruction`,`doctype`,`comment`,`opentagstart`,`attribute`,`opentag`,`closetag`,`cdata`,`error`,`end`,`ready`];var z={xmldecl:`xmldeclHandler`,text:`textHandler`,processinginstruction:`piHandler`,doctype:`doctypeHandler`,comment:`commentHandler`,opentagstart:`openTagStartHandler`,attribute:`attributeHandler`,opentag:`openTagHandler`,closetag:`closeTagHandler`,cdata:`cdataHandler`,error:`errorHandler`,end:`endHandler`,ready:`readyHandler`};e.SaxesParser=class{constructor(e){this.opt=e??{},this.fragmentOpt=!!this.opt.fragment;let t=this.xmlnsOpt=!!this.opt.xmlns;if(this.trackPosition=this.opt.position!==!1,this.fileName=this.opt.fileName,t){this.nameStartCheck=d,this.nameCheck=f,this.isName=et,this.processAttribs=this.processAttribsNS,this.pushAttrib=this.pushAttribNS,this.ns=Object.assign({__proto__:null},ee);let e=this.opt.additionalNamespaces;e!=null&&(L(this,e),Object.assign(this.ns,e))}else this.nameStartCheck=o,this.nameCheck=s,this.isName=tt,this.processAttribs=this.processAttribsPlain,this.pushAttrib=this.pushAttribPlain;this.stateTable=[this.sBegin,this.sBeginWhitespace,this.sDoctype,this.sDoctypeQuote,this.sDTD,this.sDTDQuoted,this.sDTDOpenWaka,this.sDTDOpenWakaBang,this.sDTDComment,this.sDTDCommentEnding,this.sDTDCommentEnded,this.sDTDPI,this.sDTDPIEnding,this.sText,this.sEntity,this.sOpenWaka,this.sOpenWakaBang,this.sComment,this.sCommentEnding,this.sCommentEnded,this.sCData,this.sCDataEnding,this.sCDataEnding2,this.sPIFirstChar,this.sPIRest,this.sPIBody,this.sPIEnding,this.sXMLDeclNameStart,this.sXMLDeclName,this.sXMLDeclEq,this.sXMLDeclValueStart,this.sXMLDeclValue,this.sXMLDeclSeparator,this.sXMLDeclEnding,this.sOpenTag,this.sOpenTagSlash,this.sAttrib,this.sAttribName,this.sAttribNameSawWhite,this.sAttribValue,this.sAttribValueQuoted,this.sAttribValueClosed,this.sAttribValueUnquoted,this.sCloseTag,this.sCloseTagSawWhite],this._init()}get closed(){return this._closed}_init(){var e;this.openWakaBang=``,this.text=``,this.name=``,this.piTarget=``,this.entity=``,this.q=null,this.tags=[],this.tag=null,this.topNS=null,this.chunk=``,this.chunkPosition=0,this.i=0,this.prevI=0,this.carriedFromPrevious=void 0,this.forbiddenState=R,this.attribList=[];let{fragmentOpt:t}=this;this.state=t?y:ne,this.reportedTextBeforeRoot=this.reportedTextAfterRoot=this.closedRoot=this.sawRoot=t,this.xmlDeclPossible=!t,this.xmlDeclExpects=[`version`],this.entityReturnState=void 0;let{defaultXMLVersion:n}=this.opt;if(n===void 0){if(this.opt.forceXMLVersion===!0)throw Error(`forceXMLVersion set but defaultXMLVersion is not set`);n=`1.0`}this.setXMLVersion(n),this.positionAtNewLine=0,this.doctype=!1,this._closed=!1,this.xmlDecl={version:void 0,encoding:void 0,standalone:void 0},this.line=1,this.column=0,this.ENTITIES=Object.create(te),(e=this.readyHandler)==null||e.call(this)}get position(){return this.chunkPosition+this.i}get columnIndex(){return this.position-this.positionAtNewLine}on(e,t){this[z[e]]=t}off(e){this[z[e]]=void 0}makeError(e){let t=this.fileName??``;return this.trackPosition&&(t.length>0&&(t+=`:`),t+=`${this.line}:${this.column}`),t.length>0&&(t+=`: `),Error(t+e)}fail(e){let t=this.makeError(e),n=this.errorHandler;if(n===void 0)throw t;return n(t),this}write(e){if(this.closed)return this.fail(`cannot write after close; assign an onready handler.`);let t=!1;e===null?(t=!0,e=``):typeof e==`object`&&(e=e.toString()),this.carriedFromPrevious!==void 0&&(e=`${this.carriedFromPrevious}${e}`,this.carriedFromPrevious=void 0);let n=e.length,r=e.charCodeAt(n-1);!t&&(r===Ve||r>=55296&&r<=56319)&&(this.carriedFromPrevious=e[n-1],n--,e=e.slice(0,n));let{stateTable:i}=this;for(this.chunk=e,this.i=0;this.i<n;)i[this.state].call(this);return this.chunkPosition+=n,t?this.end():this}close(){return this.write(null)}getCode10(){let{chunk:e,i:t}=this;if(this.prevI=t,this.i=t+1,t>=e.length)return g;let n=e.charCodeAt(t);if(this.column++,n<55296){if(n>=He||n===Be)return n;switch(n){case T:return this.line++,this.column=0,this.positionAtNewLine=this.position,T;case Ve:return e.charCodeAt(t+1)===T&&(this.i=t+2),this.line++,this.column=0,this.positionAtNewLine=this.position,_;default:return this.fail(`disallowed character.`),n}}if(n>56319)return n>=57344&&n<=65533||this.fail(`disallowed character.`),n;let r=65536+(n-55296)*1024+(e.charCodeAt(t+1)-56320);return this.i=t+2,r>1114111&&this.fail(`disallowed character.`),r}getCode11(){let{chunk:e,i:t}=this;if(this.prevI=t,this.i=t+1,t>=e.length)return g;let n=e.charCodeAt(t);if(this.column++,n<55296){if(n>31&&n<127||n>159&&n!==P||n===Be)return n;switch(n){case T:return this.line++,this.column=0,this.positionAtNewLine=this.position,T;case Ve:{let n=e.charCodeAt(t+1);(n===T||n===N)&&(this.i=t+2)}case N:case P:return this.line++,this.column=0,this.positionAtNewLine=this.position,_;default:return this.fail(`disallowed character.`),n}}if(n>56319)return n>=57344&&n<=65533||this.fail(`disallowed character.`),n;let r=65536+(n-55296)*1024+(e.charCodeAt(t+1)-56320);return this.i=t+2,r>1114111&&this.fail(`disallowed character.`),r}getCodeNorm(){let e=this.getCode();return e===_?T:e}unget(){this.i=this.prevI,this.column--}captureTo(e){let{i:t}=this,{chunk:n}=this;for(;;){let r=this.getCode(),i=r===_,a=i?T:r;if(a===g||e.includes(a))return this.text+=n.slice(t,this.prevI),a;i&&(this.text+=`${n.slice(t,this.prevI)}\n`,t=this.i)}}captureToChar(e){let{i:t}=this,{chunk:n}=this;for(;;){let r=this.getCode();switch(r){case _:this.text+=`${n.slice(t,this.prevI)}\n`,t=this.i,r=T;break;case g:return this.text+=n.slice(t),!1}if(r===e)return this.text+=n.slice(t,this.prevI),!0}}captureNameChars(){let{chunk:e,i:t}=this;for(;;){let n=this.getCode();if(n===g)return this.name+=e.slice(t),g;if(!s(n))return this.name+=e.slice(t,this.prevI),n===_?T:n}}skipSpaces(){for(;;){let e=this.getCodeNorm();if(e===g||!i(e))return e}}setXMLVersion(e){this.currentXMLVersion=e,e===`1.0`?(this.isChar=a,this.getCode=this.getCode10):(this.isChar=u,this.getCode=this.getCode11)}sBegin(){this.chunk.charCodeAt(0)===65279&&(this.i++,this.column++),this.state=re}sBeginWhitespace(){let e=this.i,t=this.skipSpaces();switch(this.prevI!==e&&(this.xmlDeclPossible=!1),t){case D:if(this.state=he,this.text.length!==0)throw Error(`no-empty text at start`);break;case g:break;default:this.unget(),this.state=y,this.xmlDeclPossible=!1}}sDoctype(){var e;let t=this.captureTo(Xe);switch(t){case k:(e=this.doctypeHandler)==null||e.call(this,this.text),this.text=``,this.state=y,this.doctype=!0;break;case g:break;default:this.text+=String.fromCodePoint(t),t===j?this.state=v:F(t)&&(this.state=ae,this.q=t)}}sDoctypeQuote(){let e=this.q;this.captureToChar(e)&&(this.text+=String.fromCodePoint(e),this.q=null,this.state=ie)}sDTD(){let e=this.captureTo(Ze);e!==g&&(this.text+=String.fromCodePoint(e),e===M?this.state=ie:e===D?this.state=se:F(e)&&(this.state=oe,this.q=e))}sDTDQuoted(){let e=this.q;this.captureToChar(e)&&(this.text+=String.fromCodePoint(e),this.state=v,this.q=null)}sDTDOpenWaka(){let e=this.getCodeNorm();switch(this.text+=String.fromCodePoint(e),e){case Ue:this.state=ce,this.openWakaBang=``;break;case A:this.state=fe;break;default:this.state=v}}sDTDOpenWakaBang(){let e=String.fromCodePoint(this.getCodeNorm()),t=this.openWakaBang+=e;this.text+=e,t!==`-`&&(this.state=t===`--`?le:v,this.openWakaBang=``)}sDTDComment(){this.captureToChar(qe)&&(this.text+=`-`,this.state=ue)}sDTDCommentEnding(){let e=this.getCodeNorm();this.text+=String.fromCodePoint(e),this.state=e===qe?de:le}sDTDCommentEnded(){let e=this.getCodeNorm();this.text+=String.fromCodePoint(e),e===k?this.state=v:(this.fail(`malformed comment.`),this.state=le)}sDTDPI(){this.captureToChar(A)&&(this.text+=`?`,this.state=pe)}sDTDPIEnding(){let e=this.getCodeNorm();this.text+=String.fromCodePoint(e),e===k&&(this.state=v)}sText(){this.tags.length===0?this.handleTextOutsideRoot():this.handleTextInRoot()}sEntity(){let{i:e}=this,{chunk:t}=this;loop:for(;;)switch(this.getCode()){case _:this.entity+=`${t.slice(e,this.prevI)}\n`,e=this.i;break;case Je:{let{entityReturnState:n}=this,r=this.entity+t.slice(e,this.prevI);this.state=n;let i;r===``?(this.fail(`empty entity name.`),i=`&;`):(i=this.parseEntity(r),this.entity=``),(n!==y||this.textHandler!==void 0)&&(this.text+=i);break loop}case g:this.entity+=t.slice(e);break loop}}sOpenWaka(){let e=this.getCode();if(o(e))this.state=Ne,this.unget(),this.xmlDeclPossible=!1;else switch(e){case E:this.state=Re,this.xmlDeclPossible=!1;break;case Ue:this.state=ge,this.openWakaBang=``,this.xmlDeclPossible=!1;break;case A:this.state=Ce;break;default:this.fail(`disallowed character in tag name`),this.state=y,this.xmlDeclPossible=!1}}sOpenWakaBang(){switch(this.openWakaBang+=String.fromCodePoint(this.getCodeNorm()),this.openWakaBang){case`[CDATA[`:!this.sawRoot&&!this.reportedTextBeforeRoot&&(this.fail(`text data outside of root node.`),this.reportedTextBeforeRoot=!0),this.closedRoot&&!this.reportedTextAfterRoot&&(this.fail(`text data outside of root node.`),this.reportedTextAfterRoot=!0),this.state=be,this.openWakaBang=``;break;case`--`:this.state=_e,this.openWakaBang=``;break;case`DOCTYPE`:this.state=ie,(this.doctype||this.sawRoot)&&this.fail(`inappropriately located doctype declaration.`),this.openWakaBang=``;break;default:this.openWakaBang.length>=7&&this.fail(`incorrect syntax.`)}}sComment(){this.captureToChar(qe)&&(this.state=ve)}sCommentEnding(){var e;let t=this.getCodeNorm();t===qe?(this.state=ye,(e=this.commentHandler)==null||e.call(this,this.text),this.text=``):(this.text+=`-${String.fromCodePoint(t)}`,this.state=_e)}sCommentEnded(){let e=this.getCodeNorm();e===k?this.state=y:(this.fail(`malformed comment.`),this.text+=`--${String.fromCodePoint(e)}`,this.state=_e)}sCData(){this.captureToChar(M)&&(this.state=xe)}sCDataEnding(){let e=this.getCodeNorm();e===M?this.state=Se:(this.text+=`]${String.fromCodePoint(e)}`,this.state=be)}sCDataEnding2(){var e;let t=this.getCodeNorm();switch(t){case k:(e=this.cdataHandler)==null||e.call(this,this.text),this.text=``,this.state=y;break;case M:this.text+=`]`;break;default:this.text+=`]]${String.fromCodePoint(t)}`,this.state=be}}sPIFirstChar(){let e=this.getCodeNorm();this.nameStartCheck(e)?(this.piTarget+=String.fromCodePoint(e),this.state=we):e===A||i(e)?(this.fail(`processing instruction without a target.`),this.state=e===A?Ee:Te):(this.fail(`disallowed character in processing instruction name.`),this.piTarget+=String.fromCodePoint(e),this.state=we)}sPIRest(){let{chunk:e,i:t}=this;for(;;){let n=this.getCodeNorm();if(n===g){this.piTarget+=e.slice(t);return}if(!this.nameCheck(n)){this.piTarget+=e.slice(t,this.prevI);let r=n===A;r||i(n)?this.piTarget===`xml`?(this.xmlDeclPossible||this.fail(`an XML declaration must be at the start of the document.`),this.state=r?b:De):this.state=r?Ee:Te:(this.fail(`disallowed character in processing instruction name.`),this.piTarget+=String.fromCodePoint(n));break}}}sPIBody(){if(this.text.length===0){let e=this.getCodeNorm();e===A?this.state=Ee:i(e)||(this.text=String.fromCodePoint(e))}else this.captureToChar(A)&&(this.state=Ee)}sPIEnding(){var e;let t=this.getCodeNorm();if(t===k){let{piTarget:t}=this;t.toLowerCase()===`xml`&&this.fail(`the XML declaration must appear at the start of the document.`),(e=this.piHandler)==null||e.call(this,{target:t,body:this.text}),this.piTarget=this.text=``,this.state=y}else t===A?this.text+=`?`:(this.text+=`?${String.fromCodePoint(t)}`,this.state=Te);this.xmlDeclPossible=!1}sXMLDeclNameStart(){let e=this.skipSpaces();if(e===A){this.state=b;return}e!==g&&(this.state=Oe,this.name=String.fromCodePoint(e))}sXMLDeclName(){let e=this.captureTo(Qe);if(e===A){this.state=b,this.name+=this.text,this.text=``,this.fail(`XML declaration is incomplete.`);return}if(i(e)||e===O){if(this.name+=this.text,this.text=``,!this.xmlDeclExpects.includes(this.name))switch(this.name.length){case 0:this.fail(`did not expect any more name/value pairs.`);break;case 1:this.fail(`expected the name ${this.xmlDeclExpects[0]}.`);break;default:this.fail(`expected one of ${this.xmlDeclExpects.join(`, `)}`)}this.state=e===O?Ae:ke}}sXMLDeclEq(){let e=this.getCodeNorm();if(e===A){this.state=b,this.fail(`XML declaration is incomplete.`);return}i(e)||(e!==O&&this.fail(`value required.`),this.state=Ae)}sXMLDeclValueStart(){let e=this.getCodeNorm();if(e===A){this.state=b,this.fail(`XML declaration is incomplete.`);return}i(e)||(F(e)?this.q=e:(this.fail(`value must be quoted.`),this.q=He),this.state=je)}sXMLDeclValue(){let e=this.captureTo([this.q,A]);if(e===A){this.state=b,this.text=``,this.fail(`XML declaration is incomplete.`);return}if(e===g)return;let t=this.text;switch(this.text=``,this.name){case`version`:{this.xmlDeclExpects=[`encoding`,`standalone`];let e=t;this.xmlDecl.version=e,/^1\.[0-9]+$/.test(e)?this.opt.forceXMLVersion||this.setXMLVersion(e):this.fail(`version number must match /^1\\.[0-9]+$/.`);break}case`encoding`:/^[A-Za-z][A-Za-z0-9._-]*$/.test(t)||this.fail(`encoding value must match /^[A-Za-z0-9][A-Za-z0-9._-]*$/.`),this.xmlDeclExpects=[`standalone`],this.xmlDecl.encoding=t;break;case`standalone`:t!==`yes`&&t!==`no`&&this.fail(`standalone value must match "yes" or "no".`),this.xmlDeclExpects=[],this.xmlDecl.standalone=t}this.name=``,this.state=Me}sXMLDeclSeparator(){let e=this.getCodeNorm();if(e===A){this.state=b;return}i(e)||(this.fail(`whitespace required.`),this.unget()),this.state=De}sXMLDeclEnding(){var e;this.getCodeNorm()===k?(this.piTarget===`xml`?this.name!==`version`&&this.xmlDeclExpects.includes(`version`)&&this.fail(`XML declaration must contain a version.`):this.fail(`processing instructions are not allowed before root.`),(e=this.xmldeclHandler)==null||e.call(this,this.xmlDecl),this.name=``,this.piTarget=this.text=``,this.state=y):this.fail(`The character ? is disallowed anywhere in XML declarations.`),this.xmlDeclPossible=!1}sOpenTag(){var e;let t=this.captureNameChars();if(t===g)return;let n=this.tag={name:this.name,attributes:Object.create(null)};switch(this.name=``,this.xmlnsOpt&&(this.topNS=n.ns=Object.create(null)),(e=this.openTagStartHandler)==null||e.call(this,n),this.sawRoot=!0,!this.fragmentOpt&&this.closedRoot&&this.fail(`documents may contain only one root.`),t){case k:this.openTag();break;case E:this.state=Pe;break;default:i(t)||this.fail(`disallowed character in tag name.`),this.state=x}}sOpenTagSlash(){this.getCode()===k?this.openSelfClosingTag():(this.fail(`forward-slash in opening tag not followed by >.`),this.state=x)}sAttrib(){let e=this.skipSpaces();e!==g&&(o(e)?(this.unget(),this.state=S):e===k?this.openTag():e===E?this.state=Pe:this.fail(`disallowed character in attribute name.`))}sAttribName(){let e=this.captureNameChars();e===O?this.state=w:i(e)?this.state=C:e===k?(this.fail(`attribute without value.`),this.pushAttrib(this.name,this.name),this.name=this.text=``,this.openTag()):e!==g&&this.fail(`disallowed character in attribute name.`)}sAttribNameSawWhite(){let e=this.skipSpaces();switch(e){case g:return;case O:this.state=w;break;default:this.fail(`attribute without value.`),this.text=``,this.name=``,e===k?this.openTag():o(e)?(this.unget(),this.state=S):(this.fail(`disallowed character in attribute name.`),this.state=x)}}sAttribValue(){let e=this.getCodeNorm();F(e)?(this.q=e,this.state=Fe):i(e)||(this.fail(`unquoted attribute value.`),this.state=Le,this.unget())}sAttribValueQuoted(){let{q:e,chunk:t}=this,{i:n}=this;for(;;)switch(this.getCode()){case e:this.pushAttrib(this.name,this.text+t.slice(n,this.prevI)),this.name=this.text=``,this.q=null,this.state=Ie;return;case Ge:this.text+=t.slice(n,this.prevI),this.state=me,this.entityReturnState=Fe;return;case T:case _:case Be:this.text+=`${t.slice(n,this.prevI)} `,n=this.i;break;case D:this.text+=t.slice(n,this.prevI),this.fail(`disallowed character.`);return;case g:this.text+=t.slice(n);return}}sAttribValueClosed(){let e=this.getCodeNorm();i(e)?this.state=x:e===k?this.openTag():e===E?this.state=Pe:o(e)?(this.fail(`no whitespace between attributes.`),this.unget(),this.state=S):this.fail(`disallowed character in attribute name.`)}sAttribValueUnquoted(){let e=this.captureTo(I);switch(e){case Ge:this.state=me,this.entityReturnState=Le;break;case D:this.fail(`disallowed character.`);break;case g:break;default:this.text.includes(`]]>`)&&this.fail(`the string "]]>" is disallowed in char data.`),this.pushAttrib(this.name,this.text),this.name=this.text=``,e===k?this.openTag():this.state=x}}sCloseTag(){let e=this.captureNameChars();e===k?this.closeTag():i(e)?this.state=ze:e!==g&&this.fail(`disallowed character in closing tag.`)}sCloseTagSawWhite(){switch(this.skipSpaces()){case k:this.closeTag();break;case g:break;default:this.fail(`disallowed character in closing tag.`)}}handleTextInRoot(){let{i:e,forbiddenState:t}=this,{chunk:n,textHandler:r}=this;scanLoop:for(;;)switch(this.getCode()){case D:if(this.state=he,r!==void 0){let{text:t}=this,i=n.slice(e,this.prevI);t.length===0?i.length!==0&&r(i):(r(t+i),this.text=``)}t=R;break scanLoop;case Ge:this.state=me,this.entityReturnState=y,r!==void 0&&(this.text+=n.slice(e,this.prevI)),t=R;break scanLoop;case M:switch(t){case R:t=nt;break;case nt:t=rt;break;case rt:break;default:throw Error(`impossible state`)}break;case k:t===rt&&this.fail(`the string "]]>" is disallowed in char data.`),t=R;break;case _:r!==void 0&&(this.text+=`${n.slice(e,this.prevI)}\n`),e=this.i,t=R;break;case g:r!==void 0&&(this.text+=n.slice(e));break scanLoop;default:t=R}this.forbiddenState=t}handleTextOutsideRoot(){let{i:e}=this,{chunk:t,textHandler:n}=this,r=!1;outRootLoop:for(;;){let a=this.getCode();switch(a){case D:if(this.state=he,n!==void 0){let{text:r}=this,i=t.slice(e,this.prevI);r.length===0?i.length!==0&&n(i):(n(r+i),this.text=``)}break outRootLoop;case Ge:this.state=me,this.entityReturnState=y,n!==void 0&&(this.text+=t.slice(e,this.prevI)),r=!0;break outRootLoop;case _:n!==void 0&&(this.text+=`${t.slice(e,this.prevI)}\n`),e=this.i;break;case g:n!==void 0&&(this.text+=t.slice(e));break outRootLoop;default:i(a)||(r=!0)}}r&&(!this.sawRoot&&!this.reportedTextBeforeRoot&&(this.fail(`text data outside of root node.`),this.reportedTextBeforeRoot=!0),this.closedRoot&&!this.reportedTextAfterRoot&&(this.fail(`text data outside of root node.`),this.reportedTextAfterRoot=!0))}pushAttribNS(e,t){var n;let{prefix:r,local:i}=this.qname(e),a={name:e,prefix:r,local:i,value:t};if(this.attribList.push(a),(n=this.attributeHandler)==null||n.call(this,a),r===`xmlns`){let e=t.trim();this.currentXMLVersion===`1.0`&&e===``&&this.fail(`invalid attempt to undefine prefix in XML 1.0`),this.topNS[i]=e,$e(this,i,e)}else if(e===`xmlns`){let e=t.trim();this.topNS[``]=e,$e(this,``,e)}}pushAttribPlain(e,t){var n;let r={name:e,value:t};this.attribList.push(r),(n=this.attributeHandler)==null||n.call(this,r)}end(){var e,t;this.sawRoot||this.fail(`document must contain a root element.`);let{tags:n}=this;for(;n.length>0;){let e=n.pop();this.fail(`unclosed tag: ${e.name}`)}this.state!==ne&&this.state!==y&&this.fail(`unexpected end.`);let{text:r}=this;return r.length!==0&&((e=this.textHandler)==null||e.call(this,r),this.text=``),this._closed=!0,(t=this.endHandler)==null||t.call(this),this._init(),this}resolve(e){var t;let n=this.topNS[e];if(n!==void 0)return n;let{tags:r}=this;for(let t=r.length-1;t>=0;t--)if(n=r[t].ns[e],n!==void 0)return n;return n=this.ns[e],n===void 0?(t=this.opt).resolvePrefix?.call(t,e):n}qname(e){let t=e.indexOf(`:`);if(t===-1)return{prefix:``,local:e};let n=e.slice(t+1),r=e.slice(0,t);return(r===``||n===``||n.includes(`:`))&&this.fail(`malformed name: ${e}.`),{prefix:r,local:n}}processAttribsNS(){let{attribList:e}=this,t=this.tag;{let{prefix:e,local:n}=this.qname(t.name);t.prefix=e,t.local=n;let r=t.uri=this.resolve(e)??``;e!==``&&(e===`xmlns`&&this.fail(`tags may not have "xmlns" as prefix.`),r===``&&(this.fail(`unbound namespace prefix: ${JSON.stringify(e)}.`),t.uri=e))}if(e.length===0)return;let{attributes:n}=t,r=new Set;for(let t of e){let{name:e,prefix:i,local:a}=t,o,s;i===``?(o=e===`xmlns`?h:``,s=e):(o=this.resolve(i),o===void 0&&(this.fail(`unbound namespace prefix: ${JSON.stringify(i)}.`),o=i),s=`{${o}}${a}`),r.has(s)&&this.fail(`duplicate attribute: ${s}.`),r.add(s),t.uri=o,n[e]=t}this.attribList=[]}processAttribsPlain(){let{attribList:e}=this,t=this.tag.attributes;for(let{name:n,value:r}of e)t[n]!==void 0&&this.fail(`duplicate attribute: ${n}.`),t[n]=r;this.attribList=[]}openTag(){var e;this.processAttribs();let{tags:t}=this,n=this.tag;n.isSelfClosing=!1,(e=this.openTagHandler)==null||e.call(this,n),t.push(n),this.state=y,this.name=``}openSelfClosingTag(){var e,t;this.processAttribs();let{tags:n}=this,r=this.tag;r.isSelfClosing=!0,(e=this.openTagHandler)==null||e.call(this,r),(t=this.closeTagHandler)==null||t.call(this,r),(this.tag=n[n.length-1]??null)===null&&(this.closedRoot=!0),this.state=y,this.name=``}closeTag(){let{tags:e,name:t}=this;if(this.state=y,this.name=``,t===``){this.fail(`weird empty close tag.`),this.text+=`</>`;return}let n=this.closeTagHandler,r=e.length;for(;r-->0;){let r=this.tag=e.pop();if(this.topNS=r.ns,n?.(r),r.name===t)break;this.fail(`unexpected close tag.`)}r===0?this.closedRoot=!0:r<0&&(this.fail(`unmatched closing tag: ${t}.`),this.text+=`</${t}>`)}parseEntity(e){if(e[0]!==`#`){let t=this.ENTITIES[e];return t===void 0?(this.fail(this.isName(e)?`undefined entity.`:`disallowed character in entity name.`),`&${e};`):t}let t=NaN;return e[1]===`x`&&/^#x[0-9a-f]+$/i.test(e)?t=parseInt(e.slice(2),16):/^#[0-9]+$/.test(e)&&(t=parseInt(e.slice(1),10)),this.isChar(t)?String.fromCodePoint(t):(this.fail(`malformed character entity.`),`&${e};`)}}}))(),cn=4194304,ln=new Set([`script`,`iframe`,`object`,`embed`,`audio`,`video`]),un=new Set([`foreignobject`,`div`,`span`,`p`,`br`,`b`,`strong`,`i`,`em`,`small`,`sub`,`sup`,`code`,`ul`,`ol`,`li`,`a`]),dn=/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i,fn=/^data:(?:font\/(?:woff2?|opentype|truetype)|application\/(?:x-)?font-woff2?);base64,[a-z0-9+/=\s]+$/i,pn=class extends Error{constructor(e){super(e),this.name=`ClientSvgError`}};function mn(e){let t=e.trim();return t.startsWith(`#`)||dn.test(t)||fn.test(t)}function hn(e){if(/@import|expression\s*\(|javascript\s*:|data\s*:\s*text\/html|behavior\s*:|-moz-binding/i.test(e))return!0;let t=/url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi;for(let n of e.matchAll(t))if(!mn(n[2]??``))return!0;return/url\s*\(/i.test(e.replace(t,``))}function gn(e){let t=e.trim();return t.startsWith(`#`)||dn.test(t)}function _n(e,t){let n=e.toLowerCase();return n.startsWith(`on`)?!1:n===`href`||n===`xlink:href`||n===`src`?gn(t):[`style`,`filter`,`fill`,`stroke`,`clip-path`,`mask`].includes(n)?!hn(t):n!==`xml:base`&&!/javascript\s*:/i.test(t)}function vn(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`)}function yn(e){return vn(e).replaceAll(`"`,`&quot;`)}function bn(e){if(e.type===`text`)return vn(e.value);let t=[...e.attributes].map(([e,t])=>` ${e}="${yn(t)}"`).join(``);return`<${e.name}${t}>${e.children.map(bn).join(``)}</${e.name}>`}function xn(e){return e.name.toLowerCase().split(`:`).at(-1)??e.name.toLowerCase()}function Sn(e){if(e===void 0||!/^-?\d+(?:\.\d+)?(?:px)?$/.test(e.trim()))return null;let t=Number.parseFloat(e);return Number.isFinite(t)&&t>0?t:null}function Cn(e){let t=e.attributes.get(`viewBox`)?.trim().split(/[\s,]+/).map(Number);if(t?.length===4&&t.every(Number.isFinite)&&t[2]>0&&t[3]>0)return t;let n=Sn(e.attributes.get(`width`)),r=Sn(e.attributes.get(`height`));return n!==null&&r!==null?[0,0,n,r]:null}function wn(e,t){let n=e.attributes.get(`style`);if(!n)return null;for(let e of n.split(`;`)){let n=e.indexOf(`:`);if(n>=0&&e.slice(0,n).trim().toLowerCase()===t)return e.slice(n+1).trim()}return null}function Tn(e){let t=(e.attributes.get(`fill`)??wn(e,`fill`)??``).replaceAll(` `,``).toLowerCase();return t===`white`||t===`#fff`||t===`#ffffff`||t===`rgb(255,255,255)`}function En(e){if(e===void 0||!/^-?\d+(?:\.\d+)?$/.test(e.trim()))return null;let t=Number(e);return Number.isFinite(t)?t:null}function Dn(e,t){let n=e.attributes.get(`width`)?.trim(),r=e.attributes.get(`height`)?.trim();if(n===`100%`&&r===`100%`)return!0;let i=En(e.attributes.get(`x`)??`0`),a=En(e.attributes.get(`y`)??`0`),o=En(n),s=En(r);if([i,a,o,s].some(e=>e===null))return!1;let[c,l,u,d]=t,f=.01;return i<=c+f&&a<=l+f&&i+o>=c+u-f&&a+s>=l+d-f}function On(e,t,n){let r=xn(e),i=new Set((e.attributes.get(`class`)??``).toLowerCase().split(/\s+/));return r===`rect`&&i.has(`backdrop`)||r===`rect`&&t!==null&&Tn(e)&&Dn(e,t)?!0:n===`graphviz`&&r===`polygon`&&Tn(e)&&(e.attributes.get(`stroke`)??``).toLowerCase()===`none`}function kn(e,t,n){let r=xn(e)===`svg`?Cn(e)??t:t;e.children=e.children.filter(e=>e.type===`text`||!On(e,r,n)&&(kn(e,r,n),!0))}function An(e,t){let n=(e.attributes.get(`style`)??``).split(`;`).map(e=>e.trim()).filter(Boolean).filter(e=>!/^background(?:-color)?\s*:/i.test(e));n.push(`background-color:${t}`),e.attributes.set(`style`,`${n.join(`;`)};`)}function jn(e,t=[],n=[]){return{type:`element`,name:e,attributes:new Map(t),children:n}}function Mn(e,t,n,r){let i=[],a=null;t.title&&i.push(jn(`title`,[],[{type:`text`,value:t.title}])),t.description&&i.push(jn(`desc`,[],[{type:`text`,value:t.description}]));let o=Cn(e);if((n.padding||n.background||n.frame)&&o===null)throw new pn(`Renderer output has no usable SVG dimensions for presentation settings.`);if(o!==null){let[t,r,s,c]=o,l=n.padding,u=[t-l,r-l,s+l*2,c+l*2];e.attributes.set(`viewBox`,u.join(` `)),e.attributes.has(`width`)&&e.attributes.set(`width`,String(u[2])),e.attributes.has(`height`)&&e.attributes.set(`height`,String(u[3])),n.background&&i.push(jn(`rect`,[[`x`,String(u[0])],[`y`,String(u[1])],[`width`,String(u[2])],[`height`,String(u[3])],[`fill`,n.background]])),n.frame&&(a=jn(`rect`,[[`x`,String(u[0]+.5)],[`y`,String(u[1]+.5)],[`width`,String(Math.max(0,u[2]-1))],[`height`,String(Math.max(0,u[3]-1))],[`fill`,`none`],[`stroke`,`#000000`],[`stroke-width`,`1`],[`vector-effect`,`non-scaling-stroke`]]))}n.background&&(kn(e,o,r),An(e,n.background)),e.children.unshift(...i),a&&e.children.push(a)}function Nn(e,t,n,r){if(e.length>cn)throw new pn(`Rendered SVG is too large.`);let i=null,a=[],o=0,s=null,c=new sn.SaxesParser({xmlns:!0});c.on(`doctype`,e=>{e.includes(`[`)&&(s=Error(`Internal DOCTYPE subsets are not allowed`))}),c.on(`opentag`,e=>{let t=e.local.toLowerCase(),n=t===`foreignobject`||a.some(e=>xn(e)===`foreignobject`);if(o>0||ln.has(t)||n&&!un.has(t)){o++;return}let r=jn(e.name);for(let t of Object.values(e.attributes))_n(t.name,t.value)&&r.attributes.set(t.name,t.value);let c=a.at(-1);c?c.children.push(r):i===null?i=r:s=Error(`Multiple root elements`),a.push(r)});let l=e=>{if(o>0||e===``)return;let t=a.at(-1);if(t){if(xn(t)===`style`&&hn(e))throw new pn(`Renderer output contains unsafe CSS.`);t.children.push({type:`text`,value:e})}else e.trim()!==``&&(s=Error(`Text outside root element`))};c.on(`text`,l),c.on(`cdata`,l),c.on(`closetag`,()=>{o>0?o--:a.pop()}),c.on(`error`,e=>{s=e});try{c.write(e).close()}catch(e){if(e instanceof pn)throw e;s=e}if(s!==null||i===null||xn(i)!==`svg`)throw new pn(`Renderer returned invalid SVG.`);return Mn(i,t,n,r),bn(i)}var Pn=Object.freeze({plantuml:`https://plantuml.render.diagram.zip/v1/svg`,graphviz:`https://graphviz.render.diagram.zip/v1/svg`,d2:`https://d2.render.diagram.zip/v1/svg`,c4plantuml:`https://c4plantuml.render.diagram.zip/v1/svg`,blockdiag:`https://blockdiag.render.diagram.zip/v1/svg`,seqdiag:`https://seqdiag.render.diagram.zip/v1/svg`,actdiag:`https://actdiag.render.diagram.zip/v1/svg`,nwdiag:`https://nwdiag.render.diagram.zip/v1/svg`,packetdiag:`https://packetdiag.render.diagram.zip/v1/svg`,rackdiag:`https://rackdiag.render.diagram.zip/v1/svg`,bytefield:`https://bytefield.render.diagram.zip/v1/svg`,dbml:`https://dbml.render.diagram.zip/v1/svg`,ditaa:`https://ditaa.render.diagram.zip/v1/svg`,erd:`https://erd.render.diagram.zip/v1/svg`,goat:`https://goat.render.diagram.zip/v1/svg`,nomnoml:`https://nomnoml.render.diagram.zip/v1/svg`,pikchr:`https://pikchr.render.diagram.zip/v1/svg`,structurizr:`https://structurizr.render.diagram.zip/v1/svg`,svgbob:`https://svgbob.render.diagram.zip/v1/svg`,symbolator:`https://symbolator.render.diagram.zip/v1/svg`,tikz:`https://tikz.render.diagram.zip/v1/svg`,umlet:`https://umlet.render.diagram.zip/v1/svg`,vega:`https://vega.render.diagram.zip/v1/svg`,vegalite:`https://vegalite.render.diagram.zip/v1/svg`,wavedrom:`https://wavedrom.render.diagram.zip/v1/svg`,wireviz:`https://wireviz.render.diagram.zip/v1/svg`}),Fn=Object.freeze(`mermaid.bpmn.excalidraw.diagramsnet.plantuml.c4plantuml.bytefield.nomnoml.vega.vegalite.wavedrom.blockdiag.seqdiag.actdiag.nwdiag.packetdiag.rackdiag.graphviz.erd.dbml.goat.pikchr.svgbob.ditaa.wireviz.structurizr.symbolator`.split(`.`));function In(e){return Fn.includes(e)}function Ln(e){return Pn[e]??null}function W(e,t,n){return Math.min(Math.max(e,t),n)}var Rn=class{constructor({stage:e,image:t,status:n,minimap:r,minimapImage:i,minimapViewport:a}){this.stage=e,this.image=t,this.status=n,this.minimap=r,this.minimapImage=i,this.minimapViewport=a,this.scale=1,this.x=0,this.y=0,this.objectUrl=null,this.abortController=null,this.requestNumber=0,this.pendingRender=null,this.renderLoop=null,this.latestRenderKey=null,this.latestSvgBlob=null,this.latestRendererIdentity=null,this.imageFallbackUrl=null,this.activeImageUrl=null,this.drag=null,this.image.addEventListener(`load`,()=>{this.image.src===this.activeImageUrl&&(this.imageFallbackUrl=null,this.setStatus(`Rendered`,`ready`),this.fit())}),this.image.addEventListener(`error`,()=>this.retryBlockedImage()),this.stage.addEventListener(`pointerdown`,e=>this.startPan(e)),this.stage.addEventListener(`pointermove`,e=>this.pan(e)),this.stage.addEventListener(`pointerup`,e=>this.endPan(e)),this.stage.addEventListener(`pointercancel`,e=>this.endPan(e)),this.stage.addEventListener(`wheel`,e=>this.wheelZoom(e),{passive:!1}),this.minimap.addEventListener(`pointerdown`,e=>this.moveFromMinimap(e)),new ResizeObserver(()=>this.updateTransform()).observe(this.stage)}render({type:e,source:t,options:n={},meta:r={},presentation:i={}}){if(!t.trim()){this.requestNumber++,this.pendingRender=null,this.abortController?.abort(),this.setStatus(`Write something to render.`,`idle`);return}let a=JSON.stringify({type:e,source:t,options:n,meta:r,presentation:i});return this.latestRenderKey===a&&this.latestSvgBlob?Promise.resolve():(this.pendingRender={type:e,source:t,options:n,meta:r,presentation:i,renderKey:a,requestNumber:++this.requestNumber},this.abortController?.abort(),this.renderLoop||=this.drainRenderQueue(),this.renderLoop)}async drainRenderQueue(){try{for(;this.pendingRender;){let e=this.pendingRender;this.pendingRender=null,await this.performRender(e)}}finally{this.renderLoop=null,this.pendingRender&&(this.renderLoop=this.drainRenderQueue())}}async performRender({type:e,source:t,options:n,meta:r,presentation:i,renderKey:a,requestNumber:o}){let s=new AbortController;this.abortController=s,this.setStatus(`Rendering…`,`loading`),this.stage.style.setProperty(`--render-background`,`var(--preview-bg)`);try{let c=nn(e),l;if(c)try{let a=await c.render({type:e,source:t,options:n},s.signal);l={body:Nn(a.body,r,i,e),identity:{unit:e,build:a.build||a.version,pipeline:Array.isArray(a.pipeline)?a.pipeline:[e]}},this.status.dataset.cache=`browser`,this.status.dataset.renderer=e}catch(a){if(a.name===`AbortError`||In(e))throw a;l=await this.renderThroughGateway({type:e,source:t,options:n,meta:r,presentation:i},s.signal)}else l=await this.renderThroughGateway({type:e,source:t,options:n,meta:r,presentation:i},s.signal);if(o!==this.requestNumber)return;let{blob:u,background:d}=this.normalizedSvgBlob(l.body);this.latestRenderKey=a,this.latestSvgBlob=u,this.latestRendererIdentity=l.identity,this.imageFallbackUrl=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(await u.text())}`,this.stage.style.setProperty(`--render-background`,d);let f=URL.createObjectURL(u),p=this.objectUrl;this.objectUrl=f,this.activeImageUrl=f,this.image.src=f,this.minimapImage.src=f,this.image.hidden=!1,this.setStatus(`Loading image…`,`loading`),p&&URL.revokeObjectURL(p)}catch(e){if(e.name===`AbortError`)return;this.setStatus(e.message||`Could not render this diagram.`,`error`)}finally{this.abortController===s&&(this.abortController=null)}}async renderThroughGateway({type:e,source:t,options:n,meta:r,presentation:i},a){let o=Ln(e);if(o){try{let s=await this.renderRequest(o,{source:t,format:`svg`,options:n,metadata:r,presentation:i},a);if(s.ok||s.status<500)return await this.renderResponse(s,e);await s.body?.cancel()}catch(t){if(t.name===`AbortError`||In(e))throw t}if(In(e))throw Error(`The ${e} renderer unit is unavailable.`)}let s=await this.renderRequest(`/render/v1/svg`,{engine:e,source:t,format:`svg`,options:n,metadata:r,presentation:i},a);return this.renderResponse(s,e)}renderRequest(e,t,n){return fetch(e,{method:`POST`,headers:{Accept:`image/svg+xml`,"Content-Type":`application/json`},body:JSON.stringify(t),signal:n})}async renderResponse(e,t){if(!e.ok)throw Error(await this.errorMessage(e));this.status.dataset.cache=e.headers.get(`X-Diagram-Cache`)?.toLowerCase()??`miss`,this.status.dataset.renderer=e.headers.get(`X-Diagram-Unit`)?.toLowerCase()??e.headers.get(`X-Diagram-Renderer`)?.toLowerCase()??`gateway`;let n=e.headers.get(`X-Diagram-Unit`)?.toLowerCase()??e.headers.get(`X-Diagram-Engine`)?.toLowerCase()??t,r=e.headers.get(`X-Renderer-Build`)??e.headers.get(`X-Diagram-Engine-Version`)??`${n}-unknown`,i=(e.headers.get(`X-Diagram-Pipeline`)??n).split(`,`).map(e=>e.trim().toLowerCase()).filter(Boolean);return{body:await e.text(),identity:{unit:n,build:r,pipeline:i}}}retryBlockedImage(){if(this.image.src===this.activeImageUrl){if(this.imageFallbackUrl&&this.activeImageUrl.startsWith(`blob:`)){let e=this.imageFallbackUrl;this.imageFallbackUrl=null,this.objectUrl&&URL.revokeObjectURL(this.objectUrl),this.objectUrl=null,this.activeImageUrl=e,this.image.src=e,this.minimapImage.src=e;return}this.setStatus(`The rendered image was blocked or invalid.`,`error`)}}svgBlobFor(e){let{type:t,source:n,options:r={},meta:i={},presentation:a={}}=e,o=JSON.stringify({type:t,source:n,options:r,meta:i,presentation:a});return this.latestRenderKey===o?this.latestSvgBlob:null}rendererIdentityFor(e){let{type:t,source:n,options:r={},meta:i={},presentation:a={}}=e,o=JSON.stringify({type:t,source:n,options:r,meta:i,presentation:a});return this.latestRenderKey===o?this.latestRendererIdentity:null}async errorMessage(e){let t=await e.text();if(e.headers.get(`Content-Type`)?.includes(`application/json`))try{let e=JSON.parse(t);if(typeof e?.error?.message==`string`)return e.error.message}catch{}return new DOMParser().parseFromString(t,`text/html`).body.textContent.trim().replace(/\s+/g,` `)||`Render failed with HTTP ${e.status}.`}normalizedSvgBlob(e){let t=new DOMParser().parseFromString(e,`image/svg+xml`).documentElement,n=t.getAttribute(`viewBox`)?.trim().split(/[\s,]+/).map(Number);t.nodeName===`svg`&&n?.length===4&&n.every(Number.isFinite)&&(t.hasAttribute(`width`)||t.setAttribute(`width`,String(n[2])),t.hasAttribute(`height`)||t.setAttribute(`height`,String(n[3])),e=new XMLSerializer().serializeToString(t));let r=t.style.backgroundColor||t.style.background,i=r&&r!==`transparent`?r:`#ffffff`;return{blob:new Blob([e],{type:`image/svg+xml`}),background:i}}setStatus(e,t){this.status.textContent=e,this.status.dataset.state=t}zoom(e){if(this.image.hidden)return;let t=this.stage.getBoundingClientRect();this.zoomAt(e,t.width/2,t.height/2)}zoomAt(e,t,n){let r=W(this.scale*e,.1,8),i=(t-this.x)/this.scale,a=(n-this.y)/this.scale;this.x=t-i*r,this.y=n-a*r,this.scale=r,this.updateTransform()}wheelZoom(e){if(this.image.hidden||e.target.closest(`.preview-toolbar, .minimap`))return;e.preventDefault();let t=this.stage.getBoundingClientRect(),n=e.deltaY*(e.deltaMode===WheelEvent.DOM_DELTA_LINE?16:e.deltaMode===WheelEvent.DOM_DELTA_PAGE?t.height:1);this.zoomAt(Math.exp(-W(n,-240,240)*.002),e.clientX-t.left,e.clientY-t.top)}oneToOne(){if(this.image.hidden)return;let e=this.stage.getBoundingClientRect();this.scale=1,this.x=(e.width-this.image.naturalWidth)/2,this.y=(e.height-this.image.naturalHeight)/2,this.updateTransform()}fit(){if(!this.image.naturalWidth||!this.image.naturalHeight)return;let e=this.stage.getBoundingClientRect(),t=Math.min(64,e.width*.12);this.scale=W(Math.min((e.width-t*2)/this.image.naturalWidth,(e.height-t*2)/this.image.naturalHeight),.1,2),this.x=(e.width-this.image.naturalWidth*this.scale)/2,this.y=(e.height-this.image.naturalHeight*this.scale)/2,this.updateTransform()}updateTransform(){this.image.style.transform=`translate(${this.x}px, ${this.y}px) scale(${this.scale})`,this.updateMinimap()}startPan(e){this.image.hidden||e.button!==0||e.target.closest(`.preview-toolbar, .minimap`)||(this.drag={pointerId:e.pointerId,x:e.clientX,y:e.clientY,originX:this.x,originY:this.y},this.stage.setPointerCapture(e.pointerId),this.stage.dataset.dragging=`true`)}pan(e){!this.drag||e.pointerId!==this.drag.pointerId||(this.x=this.drag.originX+e.clientX-this.drag.x,this.y=this.drag.originY+e.clientY-this.drag.y,this.updateTransform())}endPan(e){!this.drag||e.pointerId!==this.drag.pointerId||(this.drag=null,delete this.stage.dataset.dragging)}moveFromMinimap(e){if(!this.image.naturalWidth||!this.image.naturalHeight)return;let t=this.minimap.getBoundingClientRect(),n=Math.min(t.width/this.image.naturalWidth,t.height/this.image.naturalHeight),r=(t.width-this.image.naturalWidth*n)/2,i=(t.height-this.image.naturalHeight*n)/2,a=(e.clientX-t.left-r)/n,o=(e.clientY-t.top-i)/n,s=this.stage.getBoundingClientRect();this.x=s.width/2-a*this.scale,this.y=s.height/2-o*this.scale,this.updateTransform()}updateMinimap(){if(!this.image.naturalWidth||!this.image.naturalHeight)return;let e=this.stage.getBoundingClientRect(),t=this.image.naturalWidth*this.scale,n=this.image.naturalHeight*this.scale,r=this.x>=0&&this.y>=0&&this.x+t<=e.width&&this.y+n<=e.height;if(this.minimap.hidden=r,r)return;let i=this.minimap.getBoundingClientRect(),a=Math.min(i.width/this.image.naturalWidth,i.height/this.image.naturalHeight),o=(i.width-this.image.naturalWidth*a)/2,s=(i.height-this.image.naturalHeight*a)/2,c=W(-this.x/this.scale,0,this.image.naturalWidth),l=W(-this.y/this.scale,0,this.image.naturalHeight),u=W((e.width-this.x)/this.scale,0,this.image.naturalWidth),d=W((e.height-this.y)/this.scale,0,this.image.naturalHeight);this.minimapViewport.style.left=`${o+c*a}px`,this.minimapViewport.style.top=`${s+l*a}px`,this.minimapViewport.style.width=`${Math.max(4,(u-c)*a)}px`,this.minimapViewport.style.height=`${Math.max(4,(d-l)*a)}px`}},zn=`diagram.zip:draft:local:v2`,G=`diagram.zip:draft:alias:v1:`,Bn=`diagram.zip:write:v1:`,K=new Et,Vn,Hn,q=!1,Un=``,J={aliasId:null,contentId:null,renderId:null,revision:null,mode:`open`,savedMode:null,writeCapability:null,savedState:null,savedSnapshot:null,bundleKey:null,keyEnvelope:null,encryptedContent:null,encryptedMetadata:null,keyEnvelopeDirty:!1,dirty:!0},Wn=new Map;document.querySelector(`#app`).innerHTML=`
>>>>>>>> 169205c2 (migrate four renderers off Fly):server/src/main/resources/web/diagramzip/assets/index-Bl_7m9cX.js
  <main class="app-shell">
    <header class="app-header">
      <a class="brand" href="/" aria-label="New diagram"><img class="brand-mark" src="/diagram.zip/icon.svg?v=2" alt=""><span>diagram.zip</span></a>
      <div class="header-meta">
        <span class="render-status" data-state="idle" role="status">Ready</span>
        <label class="type-picker">
          <span class="sr-only">Diagram type</span>
          <select id="diagram-type"></select>
        </label>
        <a class="docs-link" href="https://docs.diagram.zip/" aria-label="Documentation" title="Documentation">
          <svg class="docs-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 4.75A2.75 2.75 0 0 1 7.75 2H19v16.25A2.75 2.75 0 0 0 16.25 21H5a2 2 0 0 1-2-2V6.75A2 2 0 0 1 5 4.75Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
            <path d="M19 18.25A2.75 2.75 0 0 0 16.25 21H7.75A2.75 2.75 0 0 1 5 18.25V4.75M8 7h7M8 10.5h7M8 14h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
        </a>
        <button class="secondary-action" id="details" type="button" aria-label="Details">Details</button>
        <button class="secondary-action" id="save" type="button">Save</button>
        <button class="primary-action" id="share" type="button">Share</button>
      </div>
    </header>

    <aside class="draft-bar" id="draft-bar" aria-live="polite" hidden>
      <p>This device has changes that are not part of the saved share link.</p>
      <div>
        <button class="secondary-action" id="restore-saved" type="button">Restore saved</button>
        <button class="primary-action" id="make-copy" type="button">Make a copy</button>
      </div>
    </aside>

    <div class="mobile-tabs" role="tablist" aria-label="Workspace panel">
      <button type="button" role="tab" aria-selected="true" data-panel="editor">Edit</button>
      <button type="button" role="tab" aria-selected="false" data-panel="preview">Preview</button>
    </div>

    <div class="workspace" data-mobile-panel="editor">
      <section class="editor-panel" aria-label="Diagram source">
        <div id="editor"></div>
      </section>
      <section class="preview-panel" aria-label="Diagram preview">
        <div class="preview-stage" id="preview-stage">
          <img id="preview-image" alt="Rendered diagram" draggable="false" hidden>
          <p class="preview-empty">Your diagram will appear here.</p>
          <div class="preview-toolbar" aria-label="Preview controls">
            <button type="button" data-preview-action="zoom-out" aria-label="Zoom out">−</button>
            <button type="button" data-preview-action="zoom-in" aria-label="Zoom in">+</button>
            <button type="button" data-preview-action="fit">Fit</button>
            <button type="button" data-preview-action="one-to-one">1:1</button>
          </div>
          <div class="minimap" id="minimap" aria-label="Preview minimap" hidden>
            <img id="minimap-image" alt="" draggable="false">
            <span id="minimap-viewport" aria-hidden="true"></span>
          </div>
        </div>
      </section>
    </div>
  </main>

  <dialog id="details-dialog" aria-labelledby="details-title">
    <form method="dialog" class="dialog-card">
      <div class="dialog-header">
        <h1 id="details-title">Diagram details</h1>
        <button class="icon-button" value="cancel" aria-label="Close">×</button>
      </div>
      <div class="details-fields">
        <label>
          <span>Title</span>
          <input id="diagram-title" maxlength="200" placeholder="Untitled diagram">
        </label>
        <label>
          <span>Description</span>
          <textarea id="diagram-description" maxlength="2000" rows="4" placeholder="What does this diagram show?"></textarea>
        </label>
        <fieldset class="presentation-fields">
          <legend>Presentation</legend>
          <label>
            <span>Canvas</span>
            <select id="diagram-background">
              <option value="">Renderer default</option>
              <option value="#ffffff">White</option>
              <option value="#f4f4f4">Soft gray</option>
            </select>
          </label>
          <label>
            <span>Padding</span>
            <div class="number-field"><input id="diagram-padding" type="number" min="0" max="256" step="4"><span>px</span></div>
          </label>
          <label class="checkbox-field"><input id="diagram-frame" type="checkbox"><span>Frame</span></label>
        </fieldset>
        <fieldset class="privacy-fields">
          <legend>Privacy</legend>
          <div>
            <strong id="privacy-label">Open</strong>
            <p id="privacy-description">Anyone with the read link can open and embed this diagram.</p>
          </div>
          <div class="privacy-actions">
            <button class="secondary-action" id="lock-diagram" type="button">Lock with password</button>
            <button class="secondary-action" id="change-password" type="button" hidden>Change password</button>
            <button class="secondary-action" id="unlock-diagram" type="button" hidden>Remove password</button>
          </div>
        </fieldset>
      </div>
      <div class="dialog-actions">
        <button class="primary-action" value="done">Done</button>
      </div>
    </form>
  </dialog>

  <dialog id="share-dialog" aria-labelledby="share-title">
    <form method="dialog" class="dialog-card">
      <div class="dialog-header">
        <h1 id="share-title">Share diagram</h1>
        <button class="icon-button" value="cancel" aria-label="Close">×</button>
      </div>
      <p class="share-status" id="share-status"></p>
      <div class="share-options">
        <label><span>Read link</span><div><input id="viewer-link" readonly><button type="button" data-copy="viewer-link">Copy</button></div></label>
        <label><span>Edit link</span><div><input id="editor-link" readonly><button type="button" data-copy="editor-link">Copy</button></div><small id="editor-link-note">Anyone with this link can update the diagram.</small></label>
        <label><span>SVG image</span><div><input id="image-link" readonly><button type="button" data-copy="image-link">Copy</button></div><small id="image-link-note"></small></label>
        <label><span>Markdown</span><div><input id="markdown-link" readonly><button type="button" data-copy="markdown-link">Copy</button></div></label>
      </div>
      <div class="dialog-actions share-actions">
        <button class="primary-action" id="share-save" type="button">Save</button>
      </div>
    </form>
  </dialog>

  <dialog id="conflict-dialog" aria-labelledby="conflict-title">
    <form method="dialog" class="dialog-card">
      <div class="dialog-header">
        <h1 id="conflict-title">Save conflict</h1>
        <button class="icon-button" value="cancel" aria-label="Close">×</button>
      </div>
      <p class="dialog-copy">Reload the saved version, or keep your work by saving it as a new diagram.</p>
      <div class="dialog-actions conflict-actions">
        <button class="secondary-action" value="reload">Reload saved</button>
        <button class="primary-action" value="copy">Save as new</button>
      </div>
    </form>
  </dialog>

  <dialog id="password-dialog" aria-labelledby="password-title">
    <form class="dialog-card" id="password-form">
      <div class="dialog-header">
        <h1 id="password-title">Enter password</h1>
        <button class="icon-button" id="password-cancel" type="button" aria-label="Close">×</button>
      </div>
      <p class="dialog-copy" id="password-copy"></p>
      <div class="details-fields">
        <label><span>Password</span><input id="diagram-password" type="password" autocomplete="current-password" required></label>
        <label id="password-confirm-field" hidden><span>Confirm password</span><input id="diagram-password-confirm" type="password" autocomplete="new-password"></label>
      </div>
      <p class="form-error" id="password-error" role="alert"></p>
      <div class="dialog-actions">
        <button class="primary-action" id="password-submit" type="submit">Unlock</button>
      </div>
    </form>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;var Gn=document.querySelector(`#diagram-type`),Kn=document.querySelector(`#diagram-title`),qn=document.querySelector(`#diagram-description`),Jn=document.querySelector(`#diagram-background`),Yn=document.querySelector(`#diagram-padding`),Xn=document.querySelector(`#diagram-frame`);for(let{id:e,label:t}of n)Gn.add(new Option(t,e));var Y=await rr(),Zn=V(Y.meta),Qn=H(Y.presentation);Gn.value=Y.type,Kn.value=Zn.title,qn.value=Zn.description,Jn.value=Qn.background,Yn.value=String(Qn.padding),Xn.checked=Qn.frame,Nr(),Hn=Y.type,Wn.set(Y.type,Y);var $n=await dt({element:document.querySelector(`#editor`),source:Y.source,diagramType:Y.type,onChange:tr,onSave:cr}),X=new Rn({stage:document.querySelector(`#preview-stage`),image:document.querySelector(`#preview-image`),status:document.querySelector(`.render-status`),minimap:document.querySelector(`#minimap`),minimapImage:document.querySelector(`#minimap-image`),minimapViewport:document.querySelector(`#minimap-viewport`)});Gn.addEventListener(`change`,()=>{let e=Gn.value;history.replaceState(null,``,a(location.href,e)),ir(pt(Wn,Hn,e,er(),lt))}),document.querySelector(`#details`).addEventListener(`click`,()=>{document.querySelector(`#details-dialog`).showModal(),Kn.focus()});for(let e of[Kn,qn,Jn,Yn,Xn])e.addEventListener(`input`,()=>{Nr(),clearTimeout(nr.timeout),nr.timeout=setTimeout(nr,220)});document.querySelector(`#details-dialog`).addEventListener(`close`,nr),document.querySelector(`#lock-diagram`).addEventListener(`click`,pr),document.querySelector(`#change-password`).addEventListener(`click`,mr),document.querySelector(`#unlock-diagram`).addEventListener(`click`,hr),document.querySelector(`#save`).addEventListener(`click`,()=>cr()),document.querySelector(`#restore-saved`).addEventListener(`click`,kr),document.querySelector(`#make-copy`).addEventListener(`click`,Ar),document.querySelector(`#share`).addEventListener(`click`,ar),document.querySelector(`#share-save`).addEventListener(`click`,async()=>{await cr(),or()}),document.querySelector(`.brand`).addEventListener(`click`,e=>{e.preventDefault(),confirm(`Start a new diagram?`)&&Mr()}),document.querySelectorAll(`[data-preview-action]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.previewAction;t===`zoom-out`&&X.zoom(.8),t===`zoom-in`&&X.zoom(1.25),t===`fit`&&X.fit(),t===`one-to-one`&&X.oneToOne()})}),document.querySelectorAll(`.mobile-tabs button`).forEach(e=>{e.addEventListener(`click`,()=>{document.querySelector(`.workspace`).dataset.mobilePanel=e.dataset.panel,document.querySelectorAll(`.mobile-tabs button`).forEach(t=>{t.setAttribute(`aria-selected`,String(t===e))}),e.dataset.panel===`preview`&&X.fit(),e.dataset.panel===`editor`&&$n.layout()})}),document.querySelectorAll(`[data-copy]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=document.querySelector(`#${e.dataset.copy}`);t.value&&(await Pr(t.value),$(`Copied`))})}),window.addEventListener(`popstate`,()=>location.reload()),window.addEventListener(`keydown`,e=>{e.defaultPrevented||(e.metaKey||e.ctrlKey)&&e.key.toLowerCase()===`s`&&(e.preventDefault(),cr())});function er(){let e=Math.min(256,Math.max(0,Number.parseInt(Yn.value,10)||0));return{type:Gn.value,source:$n.getValue(),options:{},meta:V({title:Kn.value,description:qn.value}),presentation:H({background:Jn.value,padding:e,frame:Xn.checked})}}function tr(e=1200){clearTimeout(Vn),Vn=setTimeout(Z,e)}function Z(e=!0){let t=er();Cr(t),J.dirty=J.keyEnvelopeDirty||J.savedSnapshot!==br(t,J.mode),Q(),jr(),e&&X.render(t)}function nr(){clearTimeout(nr.timeout),Z()}async function rr(){let e=vt(location.pathname);if(e){let t=St(location.hash);t&&Tr(e,t),location.hash&&history.replaceState(null,``,`${location.pathname}${location.search}`);try{let n=await K.getAlias(e),r=t??Er(e);if(n.mode===`locked`){let e=await gr(n);return e?(Dr(n,r,e.state,e.bundleKey),e.state):(Un=`A password is required to open this diagram.`,lt(it))}Dr(n,r,n.state);let i=Sr(`${G}${e}`);return i?.revision===n.revision?i.state:n.state}catch(e){Un=e instanceof Ct?e.message:`This saved diagram could not be loaded.`}}location.hash&&history.replaceState(null,``,`${location.pathname}${location.search}`);let t=i(location.search),n=Sr(zn);return t?n?.state.type===t?n.state:lt(t):n?n.state:lt(it)}function ir(e,t=!0){if(!r(e.type))throw Error(`Unsupported diagram type.`);let n=V(e.meta),i=H(e.presentation);Hn=e.type,Wn.set(e.type,{...e,meta:n,presentation:i}),Gn.value=e.type,Kn.value=n.title,qn.value=n.description,Jn.value=i.background,Yn.value=String(i.padding),Xn.checked=i.frame,Nr(),$n.setDocument({source:e.source,diagramType:e.type}),t?Z():X.render(er())}function ar(){Z(),or(),document.querySelector(`#share-dialog`).showModal()}function or(){let e=!!J.aliasId,t=e&&J.savedMode===`locked`,n=e?yt(location.origin,J.aliasId):``,r=e&&J.writeCapability?bt(location.origin,J.aliasId,J.writeCapability):``,i=t?null:J.savedState,a=i?xt(location.origin,J.aliasId,`svg`):``,o=document.querySelector(`#image-link`),s=document.querySelector(`#markdown-link`),c=i?.meta.title.trim().replace(/[\[\]\r\n]/g,` `)||`Diagram`;sr(`viewer-link`,n,`Save to create a read link`),sr(`editor-link`,r,e?`No write capability on this device`:`Save to create an edit link`),sr(`image-link`,a,t?`Encrypted diagrams cannot be embedded`:e?`Unavailable for this diagram`:`Save to create an image link`),sr(`markdown-link`,a?`![${c}](${a})`:``,t?`Encrypted diagrams cannot be embedded`:e?`Unavailable for this diagram`:`Save to create Markdown`),document.querySelector(`#editor-link-note`).textContent=r?`Anyone with this link can update the diagram.`:e?`This device has read-only access. Save a copy to create a new edit link.`:`The edit link is a bearer credential and appears after saving.`,document.querySelector(`#image-link-note`).textContent=t?`This diagram is encrypted in your browser. Image embeds are disabled because they cannot ask for its password.`:``,o.dataset.state=t?`unavailable`:`ready`,s.dataset.state=t?`unavailable`:`ready`;let l=document.querySelector(`#share-status`),u=document.querySelector(`#share-save`);u.hidden=e&&!J.dirty,e?J.dirty&&J.writeCapability?(l.textContent=`These links show the last saved version. Save your changes before sharing.`,u.textContent=`Save changes`):J.dirty?(l.textContent=`You are editing a read-only diagram. Save a copy to share your changes.`,u.textContent=`Save as new`):l.textContent=t?J.writeCapability?`The read link asks for the password. The edit link also grants permission to save changes.`:`The read link asks for the password. This device has read-only access.`:J.writeCapability?`Copy a read link, or share the edit capability carefully.`:`This diagram is read-only on this device.`:(l.textContent=`Save this diagram to create stable share links.`,u.textContent=`Save diagram`)}function sr(e,t,n){let r=document.querySelector(`#${e}`),i=document.querySelector(`[data-copy="${e}"]`);r.value=t,r.placeholder=t?``:n,i.disabled=!t}async function cr(){if(q)return!1;Z(!1);let e=er();if(J.aliasId&&!J.dirty)return $(`Already saved`),!0;q=!0,Q();try{if(J.aliasId&&J.writeCapability)return Dr(J.mode===`locked`?await K.updateLockedAlias(J.aliasId,await ur(e),J.revision,J.writeCapability):await K.updateAlias(J.aliasId,e,J.revision,J.writeCapability),J.writeCapability,e,J.mode===`locked`?J.bundleKey:null),wr(`${G}${J.aliasId}`),await dr(e),$(`Saved`),!0;let t=!!J.aliasId;return await lr(e),$(t?`Saved as a new diagram`:`Saved`),!0}catch(t){return t instanceof Ct&&t.status===412&&J.aliasId?await vr(e):($(t instanceof Error?t.message:`Could not save this diagram.`),!1)}finally{q=!1,Q()}}async function lr(e){let t=J.aliasId,n=t?`${G}${t}`:zn,r=J.bundleKey,i=J.mode===`locked`?await K.createLockedAlias(await ur(e)):await K.createAlias(e);Dr(i,i.writeCapability,e,J.mode===`locked`?r:null),Tr(i.aliasId,i.writeCapability),wr(n),history.pushState(null,``,a(`/d/${i.aliasId}`,e.type)),await dr(e)}async function ur(e){if(!(J.bundleKey instanceof Uint8Array)||!J.keyEnvelope)throw Error(`This diagram is missing its browser encryption key.`);return J.savedMode===`locked`&&J.savedSnapshot===br(e,`locked`)&&J.encryptedContent&&J.encryptedMetadata?{mode:`locked`,encryptedContent:J.encryptedContent,encryptedMetadata:J.encryptedMetadata,keyEnvelope:J.keyEnvelope}:Kt(e,J.bundleKey,J.keyEnvelope)}async function dr(e){if(!J.aliasId||!J.writeCapability)return;await X.render(e);let t=X.svgBlobFor(e),n=X.rendererIdentityFor(e);if(!t||!n)return;let r=[[`svg`,t]];try{r.push([`png`,await fr(t)])}catch{}let i=r.map(async([e,t])=>{let r=J.mode===`locked`?await Yt(t,J.bundleKey,e):t;return K.uploadRender({aliasId:J.aliasId,renderId:J.renderId,revision:J.revision,writeCapability:J.writeCapability,format:e,mode:J.mode,render:r,renderer:n})});(await Promise.allSettled(i)).every(e=>e.status===`rejected`)&&X.setStatus(`Saved; render cache unavailable`,`ready`)}async function fr(e){let t=URL.createObjectURL(e);try{let e=new Image;e.src=t,await e.decode();let n=Math.min(1,4096/Math.max(e.naturalWidth,e.naturalHeight)),r=Math.max(1,Math.round(e.naturalWidth*n)),i=Math.max(1,Math.round(e.naturalHeight*n)),a=document.createElement(`canvas`);a.width=r,a.height=i;let o=a.getContext(`2d`);if(!o)throw Error(`Canvas is unavailable.`);o.drawImage(e,0,0,r,i);let s=await new Promise(e=>a.toBlob(e,`image/png`));if(!s)throw Error(`Could not create a PNG render.`);return s}finally{URL.revokeObjectURL(t)}}async function pr(){let e=await _r({title:`Lock diagram`,copy:`The source, metadata, and saved render will be encrypted in this browser. The password cannot be recovered.`,submitLabel:`Lock diagram`,confirm:!0});if(e!==null)try{let{bundleKey:t,payload:n}=await qt(er(),e);J.mode=`locked`,J.bundleKey=t,J.keyEnvelope=n.keyEnvelope,J.encryptedContent=n.encryptedContent,J.encryptedMetadata=n.encryptedMetadata,J.keyEnvelopeDirty=!0,wr(J.aliasId?`${G}${J.aliasId}`:zn),Z(!1),$(`Locked in this browser — save to persist`)}catch(e){$(e instanceof Error?e.message:`Could not lock this diagram.`)}}async function mr(){if(J.mode!==`locked`||!(J.bundleKey instanceof Uint8Array))return;let e=await _r({title:`Change password`,copy:`Only the encrypted bundle key will be rewrapped. The diagram content does not need to be re-encrypted.`,submitLabel:`Change password`,confirm:!0});if(e!==null)try{J.keyEnvelope=await Wt(J.bundleKey,e),J.keyEnvelopeDirty=!0,Z(!1),$(`Password changed — save to persist`)}catch(e){$(e instanceof Error?e.message:`Could not change the password.`)}}function hr(){J.mode===`locked`&&confirm(`Remove password protection? The next save will store the diagram in plaintext.`)&&(J.mode=`open`,J.keyEnvelopeDirty=!1,Z(!1),$(`Password removed — save to persist`))}async function gr(e){for(;;){let t=await _r({title:`Unlock diagram`,copy:`Decryption happens only in this browser. The password is never sent to diagram.zip.`,submitLabel:`Unlock`,confirm:!1});if(t===null)return null;try{return await Jt(e,t)}catch(e){$(e instanceof Error?e.message:`Could not unlock this diagram.`)}}}function _r({title:e,copy:t,submitLabel:n,confirm:r}){let i=document.querySelector(`#password-dialog`),a=document.querySelector(`#password-form`),o=document.querySelector(`#diagram-password`),s=document.querySelector(`#diagram-password-confirm`),c=document.querySelector(`#password-confirm-field`),l=document.querySelector(`#password-error`);return document.querySelector(`#password-title`).textContent=e,document.querySelector(`#password-copy`).textContent=t,document.querySelector(`#password-submit`).textContent=n,c.hidden=!r,o.autocomplete=r?`new-password`:`current-password`,o.value=``,s.value=``,l.textContent=``,new Promise(e=>{let t=!1,n=n=>{t||(t=!0,a.removeEventListener(`submit`,c),document.querySelector(`#password-cancel`).removeEventListener(`click`,u),i.removeEventListener(`cancel`,u),i.removeEventListener(`close`,d),e(n))},c=e=>{e.preventDefault();let t=o.value;if(r&&t.length<8){l.textContent=`Use at least 8 characters.`,o.focus();return}if(r&&t!==s.value){l.textContent=`The passwords do not match.`,s.focus();return}i.close(),n(t)},u=e=>{e.preventDefault(),i.close(),n(null)},d=()=>n(null);a.addEventListener(`submit`,c),document.querySelector(`#password-cancel`).addEventListener(`click`,u),i.addEventListener(`cancel`,u),i.addEventListener(`close`,d),i.showModal(),o.focus()})}async function vr(e){let t=await yr();if(t===`reload`){let e=J.aliasId,t=J.writeCapability;try{let n=await K.getAlias(e),r=n.state,i=null;if(n.mode===`locked`){let e=await gr(n);if(!e)return!1;r=e.state,i=e.bundleKey}return Dr(n,t,r,i),wr(`${G}${e}`),ir(r,!1),Q(),$(`Reloaded saved diagram`),!0}catch(e){return $(e instanceof Error?e.message:`Could not reload this diagram.`),!1}}return t===`copy`&&(await lr(e),$(`Saved as a new diagram`),!0)}function yr(){let e=document.querySelector(`#conflict-dialog`);return e.returnValue=``,e.showModal(),new Promise(t=>{e.addEventListener(`close`,()=>t(e.returnValue),{once:!0})})}function br(e,t=`open`){return JSON.stringify({mode:t,type:e.type,source:e.source,options:e.options??{},meta:V(e.meta),presentation:H(e.presentation)})}function xr(e){if(!e||typeof e!=`object`||!r(e.type)||typeof e.source!=`string`)return null;try{return{type:e.type,source:e.source,options:e.options??{},meta:V(e.meta),presentation:H(e.presentation)}}catch{return null}}function Sr(e){try{let t=JSON.parse(localStorage.getItem(e)),n=xr(t?.state);return n?{state:n,revision:t.revision??null}:null}catch{return null}}function Cr(e){if(J.mode===`locked`)return;let t=J.aliasId?`${G}${J.aliasId}`:zn;try{localStorage.setItem(t,JSON.stringify({state:e,revision:J.revision}))}catch{}}function wr(e){try{localStorage.removeItem(e)}catch{}}function Tr(e,t){try{localStorage.setItem(`${Bn}${e}`,t)}catch{}}function Er(e){try{return St(`#w=${localStorage.getItem(`${Bn}${e}`)??``}`)}catch{return null}}function Dr(e,t,n,r=null){J={aliasId:e.aliasId,contentId:e.contentId,renderId:e.renderId,revision:e.revision,mode:e.mode,savedMode:e.mode,writeCapability:t,savedState:n,savedSnapshot:br(n,e.mode),bundleKey:r,keyEnvelope:e.mode===`locked`?e.keyEnvelope:null,encryptedContent:e.mode===`locked`?e.encryptedContent:null,encryptedMetadata:e.mode===`locked`?e.encryptedMetadata:null,keyEnvelopeDirty:!1,dirty:!1},jr(),Q()}function Q(){let e=document.querySelector(`#save`);if(Or(),q){e.textContent=`Saving…`,e.disabled=!0;return}if(J.aliasId&&!J.dirty){e.textContent=`Saved`,e.disabled=!0;return}e.textContent=J.aliasId&&!J.writeCapability?`Save copy`:`Save`,e.disabled=!1}function Or(){let e=document.querySelector(`#draft-bar`);e.hidden=!(J.aliasId&&J.savedState&&J.dirty),document.querySelector(`#restore-saved`).disabled=q,document.querySelector(`#make-copy`).disabled=q}function kr(){!J.aliasId||!J.savedState||!J.dirty||(clearTimeout(Vn),clearTimeout(nr.timeout),J.mode=J.savedMode,J.keyEnvelopeDirty=!1,J.dirty=!1,wr(`${G}${J.aliasId}`),Wn.clear(),ir(J.savedState,!1),history.replaceState(null,``,a(location.href,J.savedState.type)),jr(),Q(),$(`Restored saved diagram`))}async function Ar(){if(q||!J.aliasId||!J.dirty)return;Z(!1);let e=er();q=!0,Q();try{await lr(e),$(`Saved as a new diagram`)}catch(e){$(e instanceof Error?e.message:`Could not make a copy.`)}finally{q=!1,Q()}}function jr(){let e=J.mode===`locked`;document.querySelector(`#privacy-label`).textContent=e?`Password locked`:`Open`,document.querySelector(`#privacy-description`).textContent=e?`Source, metadata, and saved renders are encrypted in your browser. Password-locked diagrams cannot be embedded.`:`Anyone with the read link can open and embed this diagram.`,document.querySelector(`#lock-diagram`).hidden=e,document.querySelector(`#change-password`).hidden=!e,document.querySelector(`#unlock-diagram`).hidden=!e}function Mr(){J={aliasId:null,contentId:null,renderId:null,revision:null,mode:`open`,savedMode:null,writeCapability:null,savedState:null,savedSnapshot:null,bundleKey:null,keyEnvelope:null,encryptedContent:null,encryptedMetadata:null,keyEnvelopeDirty:!1,dirty:!0},Wn.clear(),history.pushState(null,``,a(`/`,it)),ir(lt(it))}function Nr(){let e=Kn.value.trim(),t=qn.value.trim();document.title=e?`${e} — diagram.zip`:`diagram.zip`,document.querySelector(`meta[name="description"]`).content=t||`Create diagrams from text and share them as a link.`}async function Pr(e){if(navigator.clipboard)return navigator.clipboard.writeText(e);let t=document.createElement(`textarea`);t.value=e,document.body.append(t),t.select(),document.execCommand(`copy`),t.remove()}function $(e){let t=document.querySelector(`#toast`);t.textContent=e,t.dataset.visible=`true`,clearTimeout($.timeout),$.timeout=setTimeout(()=>delete t.dataset.visible,1800)}Z(),Un&&$(Un);