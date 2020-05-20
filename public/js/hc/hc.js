// HC
// Copyright 2020 Mukunda Johnson <mukunda@mukunda.com>
///////////////////////////////////////////////////////////////////////////////

import Context, {gl} from "./context.js";
import Buffer from "./buffer.js";
import Packer from "./packer.js";
import Shader from "./shader.js";

export default {
   Init : Context.Init,
   Buffer, Packer, Shader, Context,
   get gl() { return gl; }
}
